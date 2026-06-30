import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { calculatePoints } from "../services/scoring.js";
import { advanceFromResult } from "../services/knockoutService.js";
import { emit } from "../lib/eventBus.js";
import { syncIfNeeded } from "../services/matchSync.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  await syncIfNeeded();
  const { userId } = req.user;

  const matches = await prisma.match.findMany({
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { userId },
        select: { id: true, homeScore: true, awayScore: true, points: true },
      },
    },
  });

  const result = matches.map((m) => ({
    ...m,
    userPrediction: m.predictions[0] ?? null,
    predictions: undefined,
  }));

  res.json(result);
});

router.put("/:id/lock", authenticate, requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { isLocked } = req.body;

  if (typeof isLocked !== "boolean")
    return res.status(400).json({ error: "isLocked must be a boolean" });

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { isLocked },
  });

  res.json({ ok: true, matchId: match.id, isLocked: match.isLocked });
  emit("update");
});

const VALID_STATUSES = ["PENDING", "STARTING", "PLAYING", "FINALIZED"];

router.put("/:id/result", authenticate, requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { homeScore, awayScore, homePenalties, awayPenalties, status } = req.body;

  if (homeScore == null || awayScore == null)
    return res
      .status(400)
      .json({ error: "homeScore and awayScore are required" });

  if (status != null && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const parsedHome = parseInt(homeScore);
  const parsedAway = parseInt(awayScore);
  const isFinalized = status === "FINALIZED";

  // Only store penalties when it's a tie (they're irrelevant otherwise)
  const isTie = parsedHome === parsedAway;
  const parsedHomePen = isTie && homePenalties != null ? parseInt(homePenalties) : null;
  const parsedAwayPen = isTie && awayPenalties != null ? parseInt(awayPenalties) : null;

  let updatedMatch;
  await prisma.$transaction(async (tx) => {
    updatedMatch = await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore: parsedHome,
        awayScore: parsedAway,
        homePenalties: parsedHomePen,
        awayPenalties: parsedAwayPen,
        ...(status != null && { matchStatus: status }),
      },
      include: { predictions: true },
    });

    if (isFinalized) {
      await Promise.all(
        updatedMatch.predictions.map((p) =>
          tx.prediction.update({
            where: { id: p.id },
            data: { points: calculatePoints(p, updatedMatch) },
          }),
        ),
      );
    } else if (status != null) {
      await tx.prediction.updateMany({
        where: { matchId },
        data: { points: null },
      });
    }
  });

  if (isFinalized) await advanceFromResult(updatedMatch);

  res.json({ ok: true, matchNumber: updatedMatch.matchNumber });
  emit("update");
});

router.delete("/:id/result", authenticate, requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.id);

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { homeScore: null, awayScore: null, homePenalties: null, awayPenalties: null, matchStatus: "PENDING" },
    });

    await tx.prediction.updateMany({
      where: { matchId },
      data: { points: null },
    });
  });

  res.json({ ok: true, matchId });
  emit("update");
});

export default router;
