import axios from 'axios';
import prisma from '../lib/prisma.js';
import { calculatePoints } from './scoring.js';

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';

async function applyResult(dbMatch, homeScore, awayScore) {
  if (dbMatch.homeScore === homeScore && dbMatch.awayScore === awayScore) return false;

  const updated = await prisma.match.update({
    where: { id: dbMatch.id },
    data: { homeScore, awayScore },
    include: { predictions: true },
  });

  await Promise.all(
    updated.predictions.map((p) =>
      prisma.prediction.update({
        where: { id: p.id },
        data: { points: calculatePoints(p, updated) },
      })
    )
  );

  return true;
}

export async function syncMatchResults() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    console.warn('[sync] FOOTBALL_DATA_API_KEY not set — skipping');
    return;
  }

  const { data } = await axios.get(`${API_BASE}/competitions/${COMPETITION}/matches`, {
    headers: { 'X-Auth-Token': apiKey },
    params: { status: 'FINISHED' },
  });

  const apiMatches = data.matches ?? [];

  const dbMatches = await prisma.match.findMany({
    where: { externalId: { not: null } },
    include: { predictions: true },
  });

  const dbByExternalId = Object.fromEntries(dbMatches.map((m) => [m.externalId, m]));

  let updated = 0;
  for (const am of apiMatches) {
    const dbMatch = dbByExternalId[String(am.id)];
    if (!dbMatch) continue;

    let homeScore = am.score?.fullTime?.home;
    let awayScore = am.score?.fullTime?.away;
    if (homeScore == null || awayScore == null) continue;

    // API teams are reversed relative to our DB — swap scores to match our home/away
    if (dbMatch.scoreReversed) [homeScore, awayScore] = [awayScore, homeScore];

    try {
      const changed = await applyResult(dbMatch, homeScore, awayScore);
      if (changed) updated++;
    } catch (err) {
      console.error(`[sync] Failed match ${dbMatch.matchNumber}:`, err.message);
    }
  }

  if (updated > 0) console.log(`[sync] Updated ${updated} match result(s)`);
}
