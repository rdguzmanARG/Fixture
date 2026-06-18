/**
 * One-time script to map local Match records to BSD (Bzzoiro Sports Data) event IDs.
 * Run once before the sync cron starts:
 *   yarn workspace fixture-server db:init-sync
 *
 * Requires BSD_API_KEY in server/.env.
 * BSD league filter param is broken server-side; we fetch the WC date range and
 * filter by league_id=27 client-side, paginating through both pages.
 */
import 'dotenv/config';
import axios from 'axios';
import prisma from '../lib/prisma.js';

const API_BASE = 'https://sports.bzzoiro.com/api/v2';
const WC_LEAGUE_ID = 27;
const WC_DATE_FROM = '2026-06-11';
const WC_DATE_TO = '2026-07-19';

// BSD uses different names for these teams — map to our DB code
const BSD_NAME_TO_CODE = {
  'Bosnia & Herzegovina': 'BIH',
  'Cabo Verde':           'CPV',
  "Côte d'Ivoire":        'CIV',
  'Türkiye':              'TUR',
  'USA':                  'USA',
};

async function fetchAllWcMatches(apiKey) {
  const headers = { Authorization: `Token ${apiKey}` };
  const params = (offset) => ({ date_from: WC_DATE_FROM, date_to: WC_DATE_TO, limit: 200, offset });

  const [page1, page2] = await Promise.all([
    axios.get(`${API_BASE}/events/`, { headers, params: params(0) }),
    axios.get(`${API_BASE}/events/`, { headers, params: params(200) }),
  ]);

  return [
    ...(page1.data.results ?? []),
    ...(page2.data.results ?? []),
  ].filter((e) => e.league_id === WC_LEAGUE_ID);
}

async function main() {
  const apiKey = process.env.BSD_API_KEY;
  if (!apiKey) throw new Error('Set BSD_API_KEY in server/.env first');

  console.log('Fetching WC 2026 matches from Bzzoiro BSD…');
  const apiMatches = await fetchAllWcMatches(apiKey);
  console.log(`  ${apiMatches.length} WC matches received`);

  if (apiMatches.length === 0) {
    console.error('\nNo WC matches returned. Check BSD_API_KEY and WC date range.');
    await prisma.$disconnect();
    return;
  }

  const sample = apiMatches.find((m) => !String(m.home_team).match(/^[W1-9L]/));
  if (sample) {
    console.log('\nSample group-stage event:');
    console.log(`  id=${sample.id}  ${sample.home_team} vs ${sample.away_team}  status=${sample.status}`);
  }
  console.log();

  const dbMatches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  });

  // Build DB name→code lookup (lowercased) and code→code (direct) for fast matching
  const dbNameToCode = {};
  for (const m of dbMatches) {
    if (m.homeTeam) dbNameToCode[m.homeTeam.name.toLowerCase()] = m.homeTeam.code;
    if (m.awayTeam) dbNameToCode[m.awayTeam.name.toLowerCase()] = m.awayTeam.code;
  }

  const dbByTeams = {};
  for (const m of dbMatches) {
    if (m.homeTeam && m.awayTeam) {
      dbByTeams[`${m.homeTeam.code}|${m.awayTeam.code}`] = m;
    }
  }

  function resolveCode(bsdName) {
    if (BSD_NAME_TO_CODE[bsdName]) return BSD_NAME_TO_CODE[bsdName];
    return dbNameToCode[bsdName.toLowerCase()] ?? null;
  }

  let matched = 0;
  let reversed = 0;
  const unmatched = [];

  for (const am of apiMatches) {
    // Skip knockout-bracket placeholders (e.g. "W73", "1A", "L101")
    if (String(am.home_team).match(/^[W1-9LGH]/)) continue;

    const homeTla = resolveCode(am.home_team);
    const awayTla = resolveCode(am.away_team);

    if (!homeTla || !awayTla) {
      unmatched.push(`"${am.home_team}" vs "${am.away_team}" (id=${am.id}) — add to BSD_NAME_TO_CODE`);
      continue;
    }

    const direct = dbByTeams[`${homeTla}|${awayTla}`];
    const flipped = dbByTeams[`${awayTla}|${homeTla}`];
    const dbMatch = direct ?? flipped;
    const isReversed = !direct && !!flipped;

    if (!dbMatch) {
      unmatched.push(`${homeTla} vs ${awayTla} (id=${am.id}) — team pair not found in DB`);
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
    console.log('\nUnmatched:');
    unmatched.forEach((s) => console.log('  •', s));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
