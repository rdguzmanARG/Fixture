import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const dbUrl = DATABASE_URL.replace(/^mysql:\/\//, 'mariadb://');
const adapter = new PrismaMariaDb(dbUrl);
const prisma = new PrismaClient({ adapter });

export default prisma;
