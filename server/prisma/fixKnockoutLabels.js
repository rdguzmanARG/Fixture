import prisma from '../src/lib/prisma.js';

// One-time script to patch knockout match labels and dates to the real 2026 WC bracket.
// Safe to run on the live DB — only touches matches 73-104, not group matches, users, or predictions.
const updates = [
  // R32 — real 2026 WC bracket
  { matchNumber: 73,  homeTeamLabel: '2A',           awayTeamLabel: '2B',           date: '2026-06-28' },
  { matchNumber: 74,  homeTeamLabel: '1E',           awayTeamLabel: '3rd A/B/C/D/F', date: '2026-06-29' },
  { matchNumber: 75,  homeTeamLabel: '1F',           awayTeamLabel: '2C',           date: '2026-06-29' },
  { matchNumber: 76,  homeTeamLabel: '1C',           awayTeamLabel: '2F',           date: '2026-06-29' },
  { matchNumber: 77,  homeTeamLabel: '1I',           awayTeamLabel: '3rd C/D/F/G/H', date: '2026-06-30' },
  { matchNumber: 78,  homeTeamLabel: '2E',           awayTeamLabel: '2I',           date: '2026-06-30' },
  { matchNumber: 79,  homeTeamLabel: '1A',           awayTeamLabel: '3rd C/E/F/H/I', date: '2026-06-30' },
  { matchNumber: 80,  homeTeamLabel: '1L',           awayTeamLabel: '3rd E/H/I/J/K', date: '2026-07-01' },
  { matchNumber: 81,  homeTeamLabel: '1D',           awayTeamLabel: '3rd B/E/F/I/J', date: '2026-07-01' },
  { matchNumber: 82,  homeTeamLabel: '1G',           awayTeamLabel: '3rd A/E/H/I/J', date: '2026-07-01' },
  { matchNumber: 83,  homeTeamLabel: '2K',           awayTeamLabel: '2L',           date: '2026-07-02' },
  { matchNumber: 84,  homeTeamLabel: '1H',           awayTeamLabel: '2J',           date: '2026-07-02' },
  { matchNumber: 85,  homeTeamLabel: '1B',           awayTeamLabel: '3rd E/F/G/I/J', date: '2026-07-02' },
  { matchNumber: 86,  homeTeamLabel: '1J',           awayTeamLabel: '2H',           date: '2026-07-03' },
  { matchNumber: 87,  homeTeamLabel: '1K',           awayTeamLabel: '3rd D/E/I/J/L', date: '2026-07-03' },
  { matchNumber: 88,  homeTeamLabel: '2D',           awayTeamLabel: '2G',           date: '2026-07-03' },
  // R16
  { matchNumber: 89,  homeTeamLabel: 'W74', awayTeamLabel: 'W77', date: '2026-07-04' },
  { matchNumber: 90,  homeTeamLabel: 'W73', awayTeamLabel: 'W75', date: '2026-07-04' },
  { matchNumber: 91,  homeTeamLabel: 'W76', awayTeamLabel: 'W78', date: '2026-07-05' },
  { matchNumber: 92,  homeTeamLabel: 'W79', awayTeamLabel: 'W80', date: '2026-07-05' },
  { matchNumber: 93,  homeTeamLabel: 'W83', awayTeamLabel: 'W84', date: '2026-07-06' },
  { matchNumber: 94,  homeTeamLabel: 'W81', awayTeamLabel: 'W82', date: '2026-07-06' },
  { matchNumber: 95,  homeTeamLabel: 'W86', awayTeamLabel: 'W88', date: '2026-07-07' },
  { matchNumber: 96,  homeTeamLabel: 'W85', awayTeamLabel: 'W87', date: '2026-07-07' },
  // QF
  { matchNumber: 97,  homeTeamLabel: 'W89', awayTeamLabel: 'W90', date: '2026-07-09' },
  { matchNumber: 98,  homeTeamLabel: 'W93', awayTeamLabel: 'W94', date: '2026-07-10' },
  { matchNumber: 99,  homeTeamLabel: 'W91', awayTeamLabel: 'W92', date: '2026-07-11' },
  { matchNumber: 100, homeTeamLabel: 'W95', awayTeamLabel: 'W96', date: '2026-07-11' },
  // SF
  { matchNumber: 101, homeTeamLabel: 'W97',  awayTeamLabel: 'W98',  date: '2026-07-14' },
  { matchNumber: 102, homeTeamLabel: 'W99',  awayTeamLabel: 'W100', date: '2026-07-15' },
  // 3rd
  { matchNumber: 103, homeTeamLabel: 'L101', awayTeamLabel: 'L102', date: '2026-07-18' },
  // Final
  { matchNumber: 104, homeTeamLabel: 'W101', awayTeamLabel: 'W102', date: '2026-07-19' },
];

async function main() {
  console.log('Patching knockout match labels and dates...');
  for (const u of updates) {
    await prisma.match.update({
      where: { matchNumber: u.matchNumber },
      data: {
        homeTeamLabel: u.homeTeamLabel,
        awayTeamLabel: u.awayTeamLabel,
        date: new Date(u.date),
        homeTeamId: null,
        awayTeamId: null,
      },
    });
  }
  console.log(`Patched ${updates.length} knockout matches.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
