/**
 * Script to populate externalId for knockout matches that were skipped during
 * the initial initExternalIds.js run (when the API still had bracket placeholders).
 *
 * Run after group stage is complete and knockout brackets are resolved in BSD:
 *   yarn workspace fixture-server db:sync-knockout-ids
 *
 * Only updates matches where externalId IS NULL, so it is safe to re-run.
 * Requires BSD_API_KEY in server/.env.
 */
import 'dotenv/config';
import axios from 'axios';
import prisma from '../lib/prisma.js';

const API_BASE = 'https://sports.bzzoiro.com/api/v2';
const WC_LEAGUE_ID = 27;
const WC_DATE_FROM = '2026-06-11';
const WC_DATE_TO = '2026-07-19';

// Manual fallback for teams where the BSD numeric ID isn't in the synced group stage data.
const BSD_NAME_TO_CODE = {
  'Bosnia & Herzegovina': 'BIH',
  'Cabo Verde':           'CPV',
  "Côte d'Ivoire":        'CIV',
  'Türkiye':              'TUR',
  'DR Congo':             'COD',
  'South Africa':         'RSA',
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

  // Only load knockout matches that still need an externalId
  const dbMatches = await prisma.match.findMany({
    where: { externalId: null, round: { not: 'Group' } },
    include: { homeTeam: true, awayTeam: true },
  });

  console.log(`  ${dbMatches.length} knockout matches in DB without externalId\n`);

  if (dbMatches.length === 0) {
    console.log('Nothing to do — all knockout matches already have externalId set.');
    await prisma.$disconnect();
    return;
  }

  // Build BSD numeric team_id → our team code from matches that are already synced.
  // The API only returns upcoming/recent events, so completed group stage events may
  // be in the response. We use their home_team_id / away_team_id to build the map.
  const syncedMatches = await prisma.match.findMany({
    where: { externalId: { not: null } },
    include: { homeTeam: true, awayTeam: true },
  });

  const apiById = new Map(apiMatches.map((e) => [String(e.id), e]));
  const bsdIdToCode = {};

  for (const m of syncedMatches) {
    const apiEvent = apiById.get(m.externalId);
    if (!apiEvent) continue;
    if (m.homeTeam?.code && apiEvent.home_team_id != null) bsdIdToCode[String(apiEvent.home_team_id)] = m.homeTeam.code;
    if (m.awayTeam?.code && apiEvent.away_team_id != null) bsdIdToCode[String(apiEvent.away_team_id)] = m.awayTeam.code;
  }

  console.log(`  Built team ID map: ${Object.keys(bsdIdToCode).length} teams from synced matches\n`);

  // Index 1: bracket label pair ("W97|W98", "L101|L102") — for rounds still showing placeholders
  const dbByLabel = {};
  for (const m of dbMatches) {
    if (m.homeTeamLabel && m.awayTeamLabel) {
      dbByLabel[`${m.homeTeamLabel}|${m.awayTeamLabel}`] = m;
    }
  }

  // Index 2: resolved team code pair — for R32 where API now shows real team names
  const dbByCode = {};
  for (const m of dbMatches) {
    if (m.homeTeam && m.awayTeam) {
      dbByCode[`${m.homeTeam.code}|${m.awayTeam.code}`] = m;
    }
  }

  function resolveCode(bsdTeamId, bsdName) {
    // Primary: BSD numeric team ID (language-independent)
    const byId = bsdIdToCode[String(bsdTeamId)];
    if (byId) return byId;
    // Fallback: manual name map for edge cases
    return BSD_NAME_TO_CODE[bsdName] ?? null;
  }

  function findMatch(am) {
    const apiHome = String(am.home_team);
    const apiAway = String(am.away_team);

    // 1. Bracket label match (W97, L101, etc.) — for rounds the API hasn't resolved yet
    const labelDirect  = dbByLabel[`${apiHome}|${apiAway}`];
    if (labelDirect)  return { dbMatch: labelDirect,  reversed: false, label: `${apiHome} vs ${apiAway}` };
    const labelFlipped = dbByLabel[`${apiAway}|${apiHome}`];
    if (labelFlipped) return { dbMatch: labelFlipped, reversed: true,  label: `${apiHome} vs ${apiAway}` };

    // 2. Team code match using BSD numeric team IDs
    const h = resolveCode(am.home_team_id, apiHome);
    const a = resolveCode(am.away_team_id, apiAway);
    if (h && a) {
      const codeDirect  = dbByCode[`${h}|${a}`];
      if (codeDirect)  return { dbMatch: codeDirect,  reversed: false, label: `${apiHome} vs ${apiAway}` };
      const codeFlipped = dbByCode[`${a}|${h}`];
      if (codeFlipped) return { dbMatch: codeFlipped, reversed: true,  label: `${apiHome} vs ${apiAway}` };
    }

    return null;
  }

  let matched = 0;
  let reversed = 0;
  const stillPending = [];

  for (const am of apiMatches) {
    const result = findMatch(am);

    if (!result) {
      if (am.round_name && !am.round_name.toLowerCase().startsWith('group')) {
        stillPending.push(`${am.home_team} vs ${am.away_team} (id=${am.id}, round=${am.round_name})`);
      }
      continue;
    }

    const { dbMatch, reversed: isReversed, label } = result;

    await prisma.match.update({
      where: { id: dbMatch.id },
      data: { externalId: String(am.id), scoreReversed: isReversed },
    });

    const flag = isReversed ? ' [reversed]' : '';
    console.log(`  ✓ #${dbMatch.matchNumber} ${dbMatch.round}  ${label}${flag}  → externalId=${am.id}`);
    matched++;
    if (isReversed) reversed++;
  }

  console.log(`\nDone: ${matched} knockout matches synced (${reversed} reversed)`);
  if (stillPending.length) {
    console.log(`\n${stillPending.length} not yet matched (BSD still showing placeholders — re-run later):`);
    stillPending.forEach((s) => console.log('  •', s));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
