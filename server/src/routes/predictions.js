import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { userId } = req.user;
  const { matchId, homeScore, awayScore } = req.body;

  if (matchId == null || homeScore == null || awayScore == null)
    return res.status(400).json({ error: 'matchId, homeScore, and awayScore are required' });

  const match = await prisma.match.findUnique({ where: { id: parseInt(matchId) } });
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.isLocked) return res.status(403).json({ error: 'Predictions for this match are closed' });

  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) return res.status(401).json({ error: 'Session expired, please log in again' });

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId, matchId: parseInt(matchId) } },
    update: { homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), points: null },
    create: { userId, matchId: parseInt(matchId), homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) },
  });

  // If result already set, immediately score this prediction
  if (match.homeScore != null && match.awayScore != null) {
    const actualResult = Math.sign(match.homeScore - match.awayScore);
    const predResult = Math.sign(prediction.homeScore - prediction.awayScore);
    let points = 0;
    if (prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore) {
      points = 3;
    } else if (predResult === actualResult) {
      points = 1;
    }
    await prisma.prediction.update({ where: { id: prediction.id }, data: { points } });
    prediction.points = points;
  }

  res.json(prediction);
});

router.get('/leaderboard', authenticate, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    select: {
      id: true,
      name: true,
      predictions: {
        select: { points: true, homeScore: true, awayScore: true },
      },
    },
  });

  const board = users.map((u) => {
    const scored = u.predictions.filter((p) => p.points != null);
    const exact = scored.filter((p) => p.points === 3).length;
    const correct = scored.filter((p) => p.points === 1).length;
    const total = scored.reduce((sum, p) => sum + (p.points ?? 0), 0);
    return {
      id: u.id,
      name: u.name,
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
