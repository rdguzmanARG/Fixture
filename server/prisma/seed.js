import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 2026 FIFA World Cup — official group assignments
// flag = ISO 3166-1 alpha-2 code (lowercase) for flagcdn.com images
// Subdivision codes: gb-eng (England), gb-sct (Scotland)
const teams = [
  // Group A
  { name: 'Mexico',              code: 'MEX', flag: 'mx',     group: 'A' },
  { name: 'South Korea',         code: 'KOR', flag: 'kr',     group: 'A' },
  { name: 'Czechia',             code: 'CZE', flag: 'cz',     group: 'A' },
  { name: 'South Africa',        code: 'RSA', flag: 'za',     group: 'A' },
  // Group B
  { name: 'Canada',              code: 'CAN', flag: 'ca',     group: 'B' },
  { name: 'Switzerland',         code: 'SUI', flag: 'ch',     group: 'B' },
  { name: 'Bosnia-Herzegovina',  code: 'BIH', flag: 'ba',     group: 'B' },
  { name: 'Qatar',               code: 'QAT', flag: 'qa',     group: 'B' },
  // Group C
  { name: 'Brazil',              code: 'BRA', flag: 'br',     group: 'C' },
  { name: 'Morocco',             code: 'MAR', flag: 'ma',     group: 'C' },
  { name: 'Scotland',            code: 'SCO', flag: 'gb-sct', group: 'C' },
  { name: 'Haiti',               code: 'HAI', flag: 'ht',     group: 'C' },
  // Group D
  { name: 'United States',       code: 'USA', flag: 'us',     group: 'D' },
  { name: 'Turkey',              code: 'TUR', flag: 'tr',     group: 'D' },
  { name: 'Australia',           code: 'AUS', flag: 'au',     group: 'D' },
  { name: 'Paraguay',            code: 'PAR', flag: 'py',     group: 'D' },
  // Group E
  { name: 'Germany',             code: 'GER', flag: 'de',     group: 'E' },
  { name: 'Ecuador',             code: 'ECU', flag: 'ec',     group: 'E' },
  { name: 'Ivory Coast',         code: 'CIV', flag: 'ci',     group: 'E' },
  { name: 'Curaçao',             code: 'CUW', flag: 'cw',     group: 'E' },
  // Group F
  { name: 'Netherlands',         code: 'NED', flag: 'nl',     group: 'F' },
  { name: 'Japan',               code: 'JPN', flag: 'jp',     group: 'F' },
  { name: 'Sweden',              code: 'SWE', flag: 'se',     group: 'F' },
  { name: 'Tunisia',             code: 'TUN', flag: 'tn',     group: 'F' },
  // Group G
  { name: 'Belgium',             code: 'BEL', flag: 'be',     group: 'G' },
  { name: 'Egypt',               code: 'EGY', flag: 'eg',     group: 'G' },
  { name: 'Iran',                code: 'IRN', flag: 'ir',     group: 'G' },
  { name: 'New Zealand',         code: 'NZL', flag: 'nz',     group: 'G' },
  // Group H
  { name: 'Spain',               code: 'ESP', flag: 'es',     group: 'H' },
  { name: 'Saudi Arabia',        code: 'KSA', flag: 'sa',     group: 'H' },
  { name: 'Uruguay',             code: 'URU', flag: 'uy',     group: 'H' },
  { name: 'Cape Verde',          code: 'CPV', flag: 'cv',     group: 'H' },
  // Group I
  { name: 'France',              code: 'FRA', flag: 'fr',     group: 'I' },
  { name: 'Senegal',             code: 'SEN', flag: 'sn',     group: 'I' },
  { name: 'Norway',              code: 'NOR', flag: 'no',     group: 'I' },
  { name: 'Iraq',                code: 'IRQ', flag: 'iq',     group: 'I' },
  // Group J
  { name: 'Argentina',           code: 'ARG', flag: 'ar',     group: 'J' },
  { name: 'Algeria',             code: 'ALG', flag: 'dz',     group: 'J' },
  { name: 'Austria',             code: 'AUT', flag: 'at',     group: 'J' },
  { name: 'Jordan',              code: 'JOR', flag: 'jo',     group: 'J' },
  // Group K
  { name: 'Portugal',            code: 'POR', flag: 'pt',     group: 'K' },
  { name: 'Colombia',            code: 'COL', flag: 'co',     group: 'K' },
  { name: 'DR Congo',            code: 'COD', flag: 'cd',     group: 'K' },
  { name: 'Uzbekistan',          code: 'UZB', flag: 'uz',     group: 'K' },
  // Group L
  { name: 'England',             code: 'ENG', flag: 'gb-eng', group: 'L' },
  { name: 'Croatia',             code: 'CRO', flag: 'hr',     group: 'L' },
  { name: 'Ghana',               code: 'GHA', flag: 'gh',     group: 'L' },
  { name: 'Panama',              code: 'PAN', flag: 'pa',     group: 'L' },
];

// Each group of 4 has 6 matches: 1v2, 1v3, 1v4, 2v3, 2v4, 3v4
// matchDay order: day1=[1v2,3v4], day2=[1v3,2v4], day3=[1v4,2v3]
function buildGroupMatches(groupTeams, groupLetter, startMatch, startDate) {
  const [t1, t2, t3, t4] = groupTeams;
  const d = new Date(startDate);
  const day = (offset) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + offset);
    return nd.toISOString();
  };
  return [
    { matchNumber: startMatch,     home: t1, away: t2, group: groupLetter, matchDay: 1, date: day(0) },
    { matchNumber: startMatch + 1, home: t3, away: t4, group: groupLetter, matchDay: 1, date: day(0) },
    { matchNumber: startMatch + 2, home: t1, away: t3, group: groupLetter, matchDay: 2, date: day(5) },
    { matchNumber: startMatch + 3, home: t2, away: t4, group: groupLetter, matchDay: 2, date: day(5) },
    { matchNumber: startMatch + 4, home: t1, away: t4, group: groupLetter, matchDay: 3, date: day(10) },
    { matchNumber: startMatch + 5, home: t2, away: t3, group: groupLetter, matchDay: 3, date: day(10) },
  ];
}

// 2026 WC — group stage starts June 11, 2026
const groupDefs = [
  { letter: 'A', startMatch: 1,  startDate: '2026-06-11' },
  { letter: 'B', startMatch: 7,  startDate: '2026-06-12' },
  { letter: 'C', startMatch: 13, startDate: '2026-06-12' },
  { letter: 'D', startMatch: 19, startDate: '2026-06-13' },
  { letter: 'E', startMatch: 25, startDate: '2026-06-13' },
  { letter: 'F', startMatch: 31, startDate: '2026-06-14' },
  { letter: 'G', startMatch: 37, startDate: '2026-06-14' },
  { letter: 'H', startMatch: 43, startDate: '2026-06-15' },
  { letter: 'I', startMatch: 49, startDate: '2026-06-15' },
  { letter: 'J', startMatch: 55, startDate: '2026-06-16' },
  { letter: 'K', startMatch: 61, startDate: '2026-06-16' },
  { letter: 'L', startMatch: 67, startDate: '2026-06-17' },
];

// Knockout stage — TBD teams filled after group stage
const knockoutMatches = [
  // Round of 32 (matches 73-88)
  { matchNumber: 73,  round: 'R32', homeTeamLabel: '1A', awayTeamLabel: '2B', date: '2026-06-29' },
  { matchNumber: 74,  round: 'R32', homeTeamLabel: '1C', awayTeamLabel: '2D', date: '2026-06-29' },
  { matchNumber: 75,  round: 'R32', homeTeamLabel: '1E', awayTeamLabel: '2F', date: '2026-06-30' },
  { matchNumber: 76,  round: 'R32', homeTeamLabel: '1G', awayTeamLabel: '2H', date: '2026-06-30' },
  { matchNumber: 77,  round: 'R32', homeTeamLabel: '1I', awayTeamLabel: '2J', date: '2026-07-01' },
  { matchNumber: 78,  round: 'R32', homeTeamLabel: '1K', awayTeamLabel: '2L', date: '2026-07-01' },
  { matchNumber: 79,  round: 'R32', homeTeamLabel: '1B', awayTeamLabel: '2A', date: '2026-07-02' },
  { matchNumber: 80,  round: 'R32', homeTeamLabel: '1D', awayTeamLabel: '2C', date: '2026-07-02' },
  { matchNumber: 81,  round: 'R32', homeTeamLabel: '1F', awayTeamLabel: '2E', date: '2026-07-03' },
  { matchNumber: 82,  round: 'R32', homeTeamLabel: '1H', awayTeamLabel: '2G', date: '2026-07-03' },
  { matchNumber: 83,  round: 'R32', homeTeamLabel: '1J', awayTeamLabel: '2I', date: '2026-07-04' },
  { matchNumber: 84,  round: 'R32', homeTeamLabel: '1L', awayTeamLabel: '2K', date: '2026-07-04' },
  { matchNumber: 85,  round: 'R32', homeTeamLabel: 'Best 3rd 1', awayTeamLabel: 'Best 3rd 2', date: '2026-07-05' },
  { matchNumber: 86,  round: 'R32', homeTeamLabel: 'Best 3rd 3', awayTeamLabel: 'Best 3rd 4', date: '2026-07-05' },
  { matchNumber: 87,  round: 'R32', homeTeamLabel: 'Best 3rd 5', awayTeamLabel: 'Best 3rd 6', date: '2026-07-06' },
  { matchNumber: 88,  round: 'R32', homeTeamLabel: 'Best 3rd 7', awayTeamLabel: 'Best 3rd 8', date: '2026-07-06' },
  // Round of 16 (matches 89-96)
  { matchNumber: 89, round: 'R16', homeTeamLabel: 'W73', awayTeamLabel: 'W74', date: '2026-07-08' },
  { matchNumber: 90, round: 'R16', homeTeamLabel: 'W75', awayTeamLabel: 'W76', date: '2026-07-08' },
  { matchNumber: 91, round: 'R16', homeTeamLabel: 'W77', awayTeamLabel: 'W78', date: '2026-07-09' },
  { matchNumber: 92, round: 'R16', homeTeamLabel: 'W79', awayTeamLabel: 'W80', date: '2026-07-09' },
  { matchNumber: 93, round: 'R16', homeTeamLabel: 'W81', awayTeamLabel: 'W82', date: '2026-07-10' },
  { matchNumber: 94, round: 'R16', homeTeamLabel: 'W83', awayTeamLabel: 'W84', date: '2026-07-10' },
  { matchNumber: 95, round: 'R16', homeTeamLabel: 'W85', awayTeamLabel: 'W86', date: '2026-07-11' },
  { matchNumber: 96, round: 'R16', homeTeamLabel: 'W87', awayTeamLabel: 'W88', date: '2026-07-11' },
  // Quarter-finals (matches 97-100)
  { matchNumber: 97,  round: 'QF', homeTeamLabel: 'W89', awayTeamLabel: 'W90', date: '2026-07-14' },
  { matchNumber: 98,  round: 'QF', homeTeamLabel: 'W91', awayTeamLabel: 'W92', date: '2026-07-14' },
  { matchNumber: 99,  round: 'QF', homeTeamLabel: 'W93', awayTeamLabel: 'W94', date: '2026-07-15' },
  { matchNumber: 100, round: 'QF', homeTeamLabel: 'W95', awayTeamLabel: 'W96', date: '2026-07-15' },
  // Semi-finals (matches 101-102)
  { matchNumber: 101, round: 'SF', homeTeamLabel: 'W97',  awayTeamLabel: 'W98',  date: '2026-07-18' },
  { matchNumber: 102, round: 'SF', homeTeamLabel: 'W99',  awayTeamLabel: 'W100', date: '2026-07-19' },
  // 3rd place (match 103)
  { matchNumber: 103, round: '3rd', homeTeamLabel: 'L101', awayTeamLabel: 'L102', date: '2026-07-25' },
  // Final (match 104)
  { matchNumber: 104, round: 'Final', homeTeamLabel: 'W101', awayTeamLabel: 'W102', date: '2026-07-26' },
];

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin1234', 10);
  await prisma.user.create({
    data: {
      email: 'admin@fixture.com',
      name: 'Admin',
      password: hashedPassword,
      isAdmin: true,
    },
  });
  console.log('Admin user created: admin@fixture.com / Admin1234');

  // Create teams
  const createdTeams = {};
  for (const team of teams) {
    const created = await prisma.team.create({ data: team });
    createdTeams[team.name] = created;
  }
  console.log(`${Object.keys(createdTeams).length} teams created`);

  // Build and create group stage matches
  let totalGroupMatches = 0;
  for (const { letter, startMatch, startDate } of groupDefs) {
    const groupTeams = teams
      .filter((t) => t.group === letter)
      .map((t) => createdTeams[t.name]);

    const matches = buildGroupMatches(groupTeams, letter, startMatch, startDate);
    for (const m of matches) {
      await prisma.match.create({
        data: {
          matchNumber: m.matchNumber,
          homeTeamId: m.home.id,
          awayTeamId: m.away.id,
          round: 'Group',
          group: m.group,
          matchDay: m.matchDay,
          date: new Date(m.date),
        },
      });
      totalGroupMatches++;
    }
  }
  console.log(`${totalGroupMatches} group stage matches created`);

  // Create knockout matches
  for (const m of knockoutMatches) {
    await prisma.match.create({
      data: {
        matchNumber: m.matchNumber,
        round: m.round,
        homeTeamLabel: m.homeTeamLabel,
        awayTeamLabel: m.awayTeamLabel,
        date: new Date(m.date),
      },
    });
  }
  console.log(`${knockoutMatches.length} knockout matches created`);

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
