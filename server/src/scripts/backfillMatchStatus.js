import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function main() {
  const { count } = await prisma.match.updateMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
      matchStatus: { not: 'FINALIZED' },
    },
    data: { matchStatus: 'FINALIZED' },
  });

  console.log(`[backfill] Marked ${count} completed match(es) as FINALIZED`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
