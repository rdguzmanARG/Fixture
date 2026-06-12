import mariadb from 'mariadb';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const pool = mariadb.createPool(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
