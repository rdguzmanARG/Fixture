import prisma from '../lib/prisma.js';

// Which eligible groups can supply a third-place team to each R32 slot.
// Based on the official 2026 FIFA World Cup bracket draw.
const THIRD_PLACE_SLOTS = [
  { matchNumber: 74, eligibleGroups: ['A', 'B', 'C', 'D', 'F'] },
  { matchNumber: 77, eligibleGroups: ['C', 'D', 'F', 'G', 'H'] },
  { matchNumber: 79, eligibleGroups: ['C', 'E', 'F', 'H', 'I'] },
  { matchNumber: 80, eligibleGroups: ['E', 'H', 'I', 'J', 'K'] },
  { matchNumber: 81, eligibleGroups: ['B', 'E', 'F', 'I', 'J'] },
  { matchNumber: 82, eligibleGroups: ['A', 'E', 'H', 'I', 'J'] },
  { matchNumber: 85, eligibleGroups: ['E', 'F', 'G', 'I', 'J'] },
  { matchNumber: 87, eligibleGroups: ['D', 'E', 'I', 'J', 'L'] },
];

function compareStandings(a, b) {
  if (b.pts !== a.pts) return b.pts - a.pts;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.teamName.localeCompare(b.teamName);
}

function computeGroupStandings(groupLetter, groupMatches) {
  const stats = {};

  for (const m of groupMatches) {
    if (!stats[m.homeTeamId]) {
      stats[m.homeTeamId] = { teamId: m.homeTeamId, teamName: m.homeTeam.name, group: groupLetter, pts: 0, gf: 0, ga: 0 };
    }
    if (!stats[m.awayTeamId]) {
      stats[m.awayTeamId] = { teamId: m.awayTeamId, teamName: m.awayTeam.name, group: groupLetter, pts: 0, gf: 0, ga: 0 };
    }

    if (m.homeScore == null || m.awayScore == null) continue;

    stats[m.homeTeamId].gf += m.homeScore;
    stats[m.homeTeamId].ga += m.awayScore;
    stats[m.awayTeamId].gf += m.awayScore;
    stats[m.awayTeamId].ga += m.homeScore;

    if (m.homeScore > m.awayScore) {
      stats[m.homeTeamId].pts += 3;
    } else if (m.homeScore < m.awayScore) {
      stats[m.awayTeamId].pts += 3;
    } else {
      stats[m.homeTeamId].pts += 1;
      stats[m.awayTeamId].pts += 1;
    }
  }

  return Object.values(stats)
    .map((s) => ({ ...s, gd: s.gf - s.ga }))
    .sort(compareStandings);
}

// Backtracking constraint-satisfaction: assigns each of the 8 qualifying third-place
// teams to the bracket slot whose eligible groups include that team's group.
function assignThirdPlaceTeams(qualifiedThirds) {
  const sortedSlots = [...THIRD_PLACE_SLOTS].sort(
    (a, b) =>
      qualifiedThirds.filter((t) => a.eligibleGroups.includes(t.group)).length -
      qualifiedThirds.filter((t) => b.eligibleGroups.includes(t.group)).length
  );

  const assignment = {};
  const used = new Set();

  function backtrack(i) {
    if (i === sortedSlots.length) return true;
    const slot = sortedSlots[i];
    for (const team of qualifiedThirds) {
      if (used.has(team.teamId)) continue;
      if (!slot.eligibleGroups.includes(team.group)) continue;
      assignment[slot.matchNumber] = team.teamId;
      used.add(team.teamId);
      if (backtrack(i + 1)) return true;
      delete assignment[slot.matchNumber];
      used.delete(team.teamId);
    }
    return false;
  }

  backtrack(0);
  return assignment;
}

function resolveLabel(label, matchNumber, allStandings, thirdAssignment) {
  if (!label) return null;

  // "1A" / "2B" — ranked team from a group
  const rankMatch = label.match(/^([12])([A-L])$/);
  if (rankMatch) {
    const rank = parseInt(rankMatch[1]) - 1;
    const group = rankMatch[2];
    return allStandings[group]?.[rank]?.teamId ?? null;
  }

  // "3rd X/Y/Z…" — resolved by backtracking assignment keyed to matchNumber
  if (label.startsWith('3rd ')) {
    return thirdAssignment?.[matchNumber] ?? null;
  }

  return null;
}

export async function checkAndPopulateR32() {
  const groupMatches = await prisma.match.findMany({
    where: { round: 'Group' },
    include: { homeTeam: true, awayTeam: true },
  });

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const allStandings = {};
  const allThirds = [];

  for (const letter of groups) {
    const gm = groupMatches.filter((m) => m.group === letter);
    if (!gm.every((m) => m.homeScore != null)) continue;

    const standings = computeGroupStandings(letter, gm);
    allStandings[letter] = standings;
    if (standings[2]) allThirds.push(standings[2]);
  }

  const completedGroups = Object.keys(allStandings).length;
  if (completedGroups === 0) return;

  let thirdAssignment = null;
  if (completedGroups === 12) {
    const qualifiedThirds = [...allThirds].sort(compareStandings).slice(0, 8);
    thirdAssignment = assignThirdPlaceTeams(qualifiedThirds);
  }

  const r32Matches = await prisma.match.findMany({ where: { round: 'R32' } });

  for (const match of r32Matches) {
    const homeTeamId = resolveLabel(match.homeTeamLabel, match.matchNumber, allStandings, thirdAssignment);
    const awayTeamId = resolveLabel(match.awayTeamLabel, match.matchNumber, allStandings, thirdAssignment);

    const data = {};
    if (homeTeamId != null) data.homeTeamId = homeTeamId;
    if (awayTeamId != null) data.awayTeamId = awayTeamId;

    if (Object.keys(data).length > 0) {
      await prisma.match.update({ where: { id: match.id }, data });
    }
  }

  if (completedGroups === 12) {
    console.log('[knockout] R32 fully populated from group standings');
  }
}

export async function advanceKnockoutWinner(match) {
  const { matchNumber, homeTeamId, awayTeamId, homeScore, awayScore } = match;
  if (homeScore == null || awayScore == null || homeScore === awayScore) return;

  const winnerId = homeScore > awayScore ? homeTeamId : awayTeamId;
  const loserId  = homeScore > awayScore ? awayTeamId : homeTeamId;

  await Promise.all([
    prisma.match.updateMany({ where: { homeTeamLabel: `W${matchNumber}` }, data: { homeTeamId: winnerId } }),
    prisma.match.updateMany({ where: { awayTeamLabel: `W${matchNumber}` }, data: { awayTeamId: winnerId } }),
    prisma.match.updateMany({ where: { homeTeamLabel: `L${matchNumber}` }, data: { homeTeamId: loserId } }),
    prisma.match.updateMany({ where: { awayTeamLabel: `L${matchNumber}` }, data: { awayTeamId: loserId } }),
  ]);
}

export async function advanceFromResult(match) {
  try {
    if (match.round === 'Group') {
      await checkAndPopulateR32();
    } else if (match.homeScore !== match.awayScore) {
      await advanceKnockoutWinner(match);
    }
  } catch (err) {
    console.error('[knockout] advanceFromResult error:', err.message);
  }
}
