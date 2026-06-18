import axios from "axios";
import prisma from "../lib/prisma.js";
import { calculatePoints } from "./scoring.js";
import { advanceFromResult } from "./knockoutService.js";
import { emit } from "../lib/eventBus.js";

const API_BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

async function applyResult(dbMatch, homeScore, awayScore) {
  const scoresUnchanged =
    dbMatch.homeScore === homeScore && dbMatch.awayScore === awayScore;
  if (scoresUnchanged && dbMatch.matchStatus === "FINALIZED") return false;

  const updated = await prisma.match.update({
    where: { id: dbMatch.id },
    data: { homeScore, awayScore, matchStatus: "FINALIZED" },
    include: { predictions: true },
  });

  if (!scoresUnchanged) {
    await Promise.all(
      updated.predictions.map((p) =>
        prisma.prediction.update({
          where: { id: p.id },
          data: { points: calculatePoints(p, updated) },
        }),
      ),
    );
  }

  return true;
}

export async function syncMatchResults() {
  const hasActive = await prisma.match.count({
    where: { matchStatus: { in: ["STARTING", "PLAYING"] } },
  });
  if (hasActive === 0) return;

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    console.warn("[sync] FOOTBALL_DATA_API_KEY not set — skipping");
    return;
  }

  const { data } = await axios.get(
    `${API_BASE}/competitions/${COMPETITION}/matches`,
    {
      headers: { "X-Auth-Token": apiKey },
      params: { status: "IN_PLAY,PAUSED,FINISHED" },
    },
  );

  const apiMatches = data.matches ?? [];

  const dbMatches = await prisma.match.findMany({
    where: {
      externalId: { not: null },
      matchStatus: { in: ["STARTING", "PLAYING"] },
    },
    include: { predictions: true },
  });

  const dbByExternalId = Object.fromEntries(
    dbMatches.map((m) => [m.externalId, m]),
  );

  let updated = 0;
  for (const am of apiMatches) {
    const dbMatch = dbByExternalId[String(am.id)];
    if (!dbMatch) continue;

    let h = am.score?.fullTime?.home ?? 0;
    let a = am.score?.fullTime?.away ?? 0;

    // API teams are reversed relative to our DB — swap scores to match our home/away
    if (dbMatch.scoreReversed) [h, a] = [a, h];

    try {
      if (am.status === "FINISHED") {
        const changed = await applyResult(dbMatch, h, a);
        if (changed) {
          updated++;
          await advanceFromResult({ ...dbMatch, homeScore: h, awayScore: a });
        }
      } else {
        // IN_PLAY or PAUSED: update live score without finalizing or assigning points
        const noChange =
          dbMatch.homeScore === h &&
          dbMatch.awayScore === a &&
          dbMatch.matchStatus === "PLAYING";
        if (!noChange) {
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: { homeScore: h, awayScore: a, matchStatus: "PLAYING" },
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
