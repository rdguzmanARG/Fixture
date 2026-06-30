import axios from "axios";
import prisma from "../lib/prisma.js";
import { calculatePoints } from "./scoring.js";
import { advanceFromResult } from "./knockoutService.js";
import { emit } from "../lib/eventBus.js";

const API_BASE = "https://sports.bzzoiro.com/api/v2";

let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 10_000;

export async function syncIfNeeded() {
  const now = Date.now();
  if (now - lastSyncAt < SYNC_COOLDOWN_MS) return;
  lastSyncAt = now;
  await lockStartedMatches();
  await syncMatchResults();
  await backfillMissingPenalties();
}

async function applyResult(dbMatch, homeScore, awayScore, homePenalties, awayPenalties) {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.match.update({
      where: { id: dbMatch.id },
      data: {
        homeScore,
        awayScore,
        homePenalties: homePenalties ?? null,
        awayPenalties: awayPenalties ?? null,
        matchStatus: "FINALIZED",
      },
      include: { predictions: true },
    });

    await Promise.all(
      updated.predictions.map((p) =>
        tx.prediction.update({
          where: { id: p.id },
          data: { points: calculatePoints(p, updated) },
        }),
      ),
    );
  });

  return true;
}

async function fetchEventById(apiKey, eventId) {
  try {
    const { data } = await axios.get(
      `${API_BASE}/events/${eventId}?league_id=27`,
      {
        headers: { Authorization: `Token ${apiKey}` },
      },
    );
    return data;
  } catch {
    return null;
  }
}

export async function syncMatchResults() {
  const hasActive = await prisma.match.count({
    where: { matchStatus: { in: ["STARTING", "PLAYING"] } },
  });
  if (hasActive === 0) return;

  const apiKey = process.env.BSD_API_KEY;
  if (!apiKey) {
    console.warn("[sync] BSD_API_KEY not set — skipping");
    return;
  }

  const { data: liveData } = await axios.get(
    `${API_BASE}/events/live?league_id=27`,
    {
      headers: { Authorization: `Token ${apiKey}` },
    },
  );

  const liveEvents = liveData.events ?? [];
  const liveByEventId = Object.fromEntries(
    liveEvents.map((e) => [String(e.id), e]),
  );

  const dbMatches = await prisma.match.findMany({
    where: {
      externalId: { not: null },
      matchStatus: { in: ["STARTING", "PLAYING"] },
    },
    include: { predictions: true },
  });

  let updated = 0;
  for (const dbMatch of dbMatches) {
    let event = liveByEventId[dbMatch.externalId];

    // PLAYING match absent from live list → likely just finished; confirm via individual fetch
    if (
      !event &&
      (dbMatch.matchStatus === "PLAYING" || dbMatch.matchStatus === "STARTING")
    ) {
      event = await fetchEventById(apiKey, dbMatch.externalId);
    }

    if (!event) continue;

    const status = event.status;
    let h = event.home_score ?? 0;
    let a = event.away_score ?? 0;

    if (dbMatch.scoreReversed) [h, a] = [a, h];

    let hp = event.penalty_shootout?.home ?? null;
    let ap = event.penalty_shootout?.away ?? null;
    if (dbMatch.scoreReversed && hp != null) [hp, ap] = [ap, hp];

    try {
      if (status === "finished") {
        const changed = await applyResult(dbMatch, h, a, hp, ap);
        if (changed) {
          updated++;
          await advanceFromResult({ ...dbMatch, homeScore: h, awayScore: a, homePenalties: hp, awayPenalties: ap });
        }
      } else if (
        status == "interrupted" ||
        status === "inprogress" ||
        status === "penalties"
      ) {
        const currentMinute = event.current_minute ?? null;
        const noChange =
          dbMatch.homeScore === h &&
          dbMatch.awayScore === a &&
          dbMatch.matchStatus === "PLAYING" &&
          dbMatch.currentMinute === currentMinute;
        if (!noChange) {
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: {
              homeScore: h,
              awayScore: a,
              matchStatus: "PLAYING",
              currentMinute,
            },
          });
          updated++;
        }
      }
    } catch (err) {
      console.error(`[sync] Failed match ${dbMatch.matchNumber}:`, err.message);
    }
  }

  if (updated > 0) {
    console.log(`[sync] Updated ${updated} match result(s)`);
    emit("update");
  }
}

// Pick up penalty scores for knockout matches that were finalized with a tied score
// but have no penalty data yet (e.g., the sync ran before penalties were entered in BSD).
async function backfillMissingPenalties() {
  const apiKey = process.env.BSD_API_KEY;
  if (!apiKey) return;

  const tiedKnockout = await prisma.match.findMany({
    where: {
      round: { not: "Group" },
      matchStatus: "FINALIZED",
      homePenalties: null,
      externalId: { not: null },
      // only matches where regular-time score is tied
      AND: [{ homeScore: { not: null } }, { awayScore: { not: null } }],
    },
    include: { predictions: true },
  });

  // Filter to only truly tied matches (Prisma can't compare two columns directly)
  const tied = tiedKnockout.filter((m) => m.homeScore === m.awayScore);
  if (tied.length === 0) return;

  let patched = 0;
  for (const dbMatch of tied) {
    const event = await fetchEventById(apiKey, dbMatch.externalId);
    if (!event?.penalty_shootout) continue;

    let hp = event.penalty_shootout.home;
    let ap = event.penalty_shootout.away;
    if (dbMatch.scoreReversed) [hp, ap] = [ap, hp];

    await prisma.match.update({
      where: { id: dbMatch.id },
      data: { homePenalties: hp, awayPenalties: ap },
    });

    await advanceFromResult({ ...dbMatch, homePenalties: hp, awayPenalties: ap });
    patched++;
  }

  if (patched > 0) {
    console.log(`[sync] Backfilled penalties for ${patched} match(es)`);
    emit("update");
  }
}

export async function lockStartedMatches() {
  const cutoff = new Date(Date.now() + 5 * 60 * 1000);
  const { count } = await prisma.match.updateMany({
    where: { date: { lte: cutoff }, isLocked: false },
    data: { isLocked: true, matchStatus: "STARTING" },
  });

  if (count > 0) {
    console.log(`[lock] Locked ${count} match(es)`);
    emit("update");
  }
}
