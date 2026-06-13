/**
 * One-time script to update Match.date with real kickoff times from football-data.org.
 * Requires externalId to be set first (run db:init-sync beforehand).
 *
 *   yarn workspace fixture-server db:update-times
 */
import 'dotenv/config';
import axios from 'axios';
import prisma from '../lib/prisma.js';

const API_BASE = 'https://api.football-data.org/v4';

function fmt(date) {
  if (!date) return 'null';
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

async function main() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error('Set FOOTBALL_DATA_API_KEY in server/.env first');

  console.log('Fetching WC 2026 match times from football-data.org…');
  const { data } = await axios.get(`${API_BASE}/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': apiKey },
  });

  const apiMatches = data.matches ?? [];
  console.log(`  ${apiMatches.length} matches received from API\n`);

  const timeByExternalId = Object.fromEntries(
    apiMatches.map((m) => [String(m.id), m.utcDate])
  );

  const dbMatches = await prisma.match.findMany({
    where: { externalId: { not: null } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: 'asc' },
  });

  const noExternalId = await prisma.match.count({ where: { externalId: null } });

  let updated = 0;
  let alreadyCorrect = 0;
  const notInApi = [];

  for (const dbMatch of dbMatches) {
    const utcDate = timeByExternalId[dbMatch.externalId];
    if (!utcDate) {
      notInApi.push(`#${dbMatch.matchNumber} (externalId=${dbMatch.externalId})`);
      continue;
    }

    const newDate = new Date(utcDate);
    if (dbMatch.date?.getTime() === newDate.getTime()) {
      alreadyCorrect++;
      continue;
    }

    await prisma.match.update({ where: { id: dbMatch.id }, data: { date: newDate } });

    const home = dbMatch.homeTeam?.code ?? dbMatch.homeTeamLabel ?? '?';
    const away = dbMatch.awayTeam?.code ?? dbMatch.awayTeamLabel ?? '?';
    console.log(`  ✓ #${String(dbMatch.matchNumber).padStart(3)}  ${home} vs ${away}  ${fmt(dbMatch.date)} → ${fmt(newDate)}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${alreadyCorrect} already correct, ${notInApi.length} not in API response`);
  if (noExternalId > 0) console.log(`  ${noExternalId} match(es) have no externalId — run db:init-sync first to map them`);
  if (notInApi.length) {
    console.log('\nNot found in API response:');
    notInApi.forEach((s) => console.log('  •', s));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
