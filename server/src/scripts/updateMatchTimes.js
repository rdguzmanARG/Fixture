/**
 * One-time script to update Match.date with real kickoff times from BSD.
 * Requires externalId to be set first (run db:init-sync beforehand).
 *
 *   yarn workspace fixture-server db:update-times
 */
import 'dotenv/config';
import axios from 'axios';
import prisma from '../lib/prisma.js';

const API_BASE = 'https://sports.bzzoiro.com/api/v2';
const WC_LEAGUE_ID = 27;
const WC_DATE_FROM = '2026-06-11';
const WC_DATE_TO = '2026-07-19';

function fmt(date) {
  if (!date) return 'null';
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

async function main() {
  const apiKey = process.env.BSD_API_KEY;
  if (!apiKey) throw new Error('Set BSD_API_KEY in server/.env first');

  console.log('Fetching WC 2026 match times from Bzzoiro BSD…');
  const headers = { Authorization: `Token ${apiKey}` };
  const params = (offset) => ({ date_from: WC_DATE_FROM, date_to: WC_DATE_TO, limit: 200, offset });

  const [page1, page2] = await Promise.all([
    axios.get(`${API_BASE}/events/`, { headers, params: params(0) }),
    axios.get(`${API_BASE}/events/`, { headers, params: params(200) }),
  ]);

  const apiMatches = [
    ...(page1.data.results ?? []),
    ...(page2.data.results ?? []),
  ].filter((e) => e.league_id === WC_LEAGUE_ID);

  console.log(`  ${apiMatches.length} WC matches received\n`);

  const timeByExternalId = Object.fromEntries(
    apiMatches.map((m) => [String(m.id), m.event_date])
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
    const eventDate = timeByExternalId[dbMatch.externalId];
    if (!eventDate) {
      notInApi.push(`#${dbMatch.matchNumber} (externalId=${dbMatch.externalId})`);
      continue;
    }

    const newDate = new Date(eventDate);
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
  if (noExternalId > 0) console.log(`  ${noExternalId} match(es) have no externalId — run db:init-sync first`);
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
