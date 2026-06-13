import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { matchId, homeScore, awayScore } = req.body;

  if (matchId == null || homeScore == null || awayScore == null)
    return res
      .status(400)
      .json({ error: "matchId, homeScore, and awayScore are required" });

  const match = await prisma.match.findUnique({
    where: { id: parseInt(matchId) },
  });
  if (!match) return res.status(404).json({ error: "Match not found" });
  if (match.isLocked)
    return res
      .status(403)
      .json({ error: "Predictions for this match are closed" });

  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists)
    return res
      .status(401)
      .json({ error: "Session expired, please log in again" });

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId, matchId: parseInt(matchId) } },
    update: {
      homeScore: parseInt(homeScore),
      awayScore: parseInt(awayScore),
      points: null,
    },
    create: {
      userId,
      matchId: parseInt(matchId),
      homeScore: parseInt(homeScore),
      awayScore: parseInt(awayScore),
    },
  });

  // If result already set, immediately score this prediction
  if (match.homeScore != null && match.awayScore != null) {
    const actualResult = Math.sign(match.homeScore - match.awayScore);
    const predResult = Math.sign(prediction.homeScore - prediction.awayScore);
    let points = 0;
    if (
      prediction.homeScore === match.homeScore &&
      prediction.awayScore === match.awayScore
    ) {
      points = 5;
    } else if (predResult === actualResult) {
      points = 3;
    }
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { points },
    });
    prediction.points = points;
  }

  res.json(prediction);
});

router.delete("/:matchId", authenticate, async (req, res) => {
  const { userId } = req.user;
  const matchId = parseInt(req.params.matchId);

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: "Match not found" });
  if (match.isLocked)
    return res.status(403).json({ error: "Predictions for this match are closed" });

  const deleted = await prisma.prediction.deleteMany({
    where: { userId, matchId },
  });

  if (deleted.count === 0)
    return res.status(404).json({ error: "Prediction not found" });

  res.json({ ok: true });
});

router.get("/user/:userId", authenticate, async (req, res) => {
  const userId = parseInt(req.params.userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
    orderBy: [{ match: { date: "asc" } }, { match: { matchNumber: "asc" } }],
  });

  res.json({ user, predictions });
});

router.get("/match/:matchId", authenticate, async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) return res.status(404).json({ error: "Match not found" });

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    include: { user: { select: { id: true, username: true } } },
    orderBy: [{ points: "desc" }, { user: { username: "asc" } }],
  });

  res.json({ match, predictions });
});

router.get("/leaderboard", authenticate, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    select: {
      id: true,
      username: true,
      predictions: {
        select: { points: true, homeScore: true, awayScore: true },
      },
    },
  });

  const board = users.map((u) => {
    const scored = u.predictions.filter((p) => p.points != null);
    const exact = scored.filter((p) => p.points === 5).length;
    const correct = scored.filter((p) => p.points === 3).length;
    const total = scored.reduce((sum, p) => sum + (p.points ?? 0), 0);
    return {
      id: u.id,
      username: u.username,
      points: total,
      exact,
      correct,
      predictions: u.predictions.length,
    };
  });

  board.sort((a, b) => b.points - a.points || b.exact - a.exact);
  res.json(board);
});

export default router;
