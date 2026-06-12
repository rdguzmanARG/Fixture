import mariadb from 'mariadb';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL.replace(/^mysql:\/\//, 'mariadb://');
const pool = mariadb.createPool(dbUrl);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
