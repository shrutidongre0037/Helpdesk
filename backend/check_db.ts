import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const schemas = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata`;
    console.log('Schemas:', schemas);
    const tables = await prisma.$queryRaw`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'job'`;
    console.log('Job table:', tables);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
