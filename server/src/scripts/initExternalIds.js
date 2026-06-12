/**
 * One-time script to map local Match records to football-data.org match IDs.
 * Run once before the sync cron starts:
 *   yarn workspace fixture-server db:init-sync
 *
 * Matches by homeTeam.code + awayTeam.code (TLA). When the API has teams in
 * the reverse order from our DB, the match is stored with scoreReversed=true
 * so the sync service knows to swap home/away scores when applying results.
 */
import 'dotenv/config';
import axios from 'axios';
import prisma from '../lib/prisma.js';

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';

async function main() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error('Set FOOTBALL_DATA_API_KEY in server/.env first');

  console.log('Fetching WC 2026 matches from football-data.org…');
  const { data } = await axios.get(`${API_BASE}/competitions/${COMPETITION}/matches`, {
    headers: { 'X-Auth-Token': apiKey },
  });

  const apiMatches = data.matches ?? [];
  console.log(`  ${apiMatches.length} matches received`);

  const dbMatches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });

  // index by "HOMECODE|AWAYCODE"
  const dbByTeams = {};
  for (const m of dbMatches) {
    if (m.homeTeam && m.awayTeam) {
      dbByTeams[`${m.homeTeam.code}|${m.awayTeam.code}`] = m;
    }
  }

  // API TLA → our DB code, for cases where they differ
  const TLA_MAP = { URY: 'URU' };
  const normalize = (tla) => TLA_MAP[tla] ?? tla;

  let matched = 0;
  let reversed = 0;
  const unmatched = [];

  for (const am of apiMatches) {
    const homeTla = normalize(am.homeTeam?.tla);
    const awayTla = normalize(am.awayTeam?.tla);
    if (!homeTla || !awayTla) continue;

    // Try direct match first, then reversed
    const direct = dbByTeams[`${homeTla}|${awayTla}`];
    const flipped = dbByTeams[`${awayTla}|${homeTla}`];
    const dbMatch = direct ?? flipped;
    const isReversed = !direct && !!flipped;

    if (!dbMatch) {
      unmatched.push(`${homeTla} vs ${awayTla} (API id=${am.id})`);
      continue;
    }

    await prisma.match.update({
      where: { id: dbMatch.id },
      data: { externalId: String(am.id), scoreReversed: isReversed },
    });

    const flag = isReversed ? ' [reversed]' : '';
    console.log(`  ✓ #${dbMatch.matchNumber}  ${homeTla} vs ${awayTla}${flag}  → externalId=${am.id}`);
    matched++;
    if (isReversed) reversed++;
  }

  console.log(`\nDone: ${matched} matched (${reversed} reversed), ${unmatched.length} unmatched`);
  if (unmatched.length) {
    console.log('\nUnmatched (TLA not found in our DB — fix manually):');
    unmatched.forEach((s) => console.log('  •', s));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
