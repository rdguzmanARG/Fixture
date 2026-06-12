import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { calculatePoints } from "../services/scoring.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
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
});

router.put("/:id/result", authenticate, requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { homeScore, awayScore } = req.body;

  if (homeScore == null || awayScore == null)
    return res
      .status(400)
      .json({ error: "homeScore and awayScore are required" });

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) },
    include: { predictions: true },
  });

  await Promise.all(
    match.predictions.map((p) =>
      prisma.prediction.update({
        where: { id: p.id },
        data: { points: calculatePoints(p, match) },
      })
    ),
  );

  res.json({ ok: true, matchNumber: match.matchNumber });
});

router.delete("/:id/result", authenticate, requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.id);

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore: null, awayScore: null },
  });

  await prisma.prediction.updateMany({
    where: { matchId },
    data: { points: null },
  });

  res.json({ ok: true, matchId });
});

export default router;
