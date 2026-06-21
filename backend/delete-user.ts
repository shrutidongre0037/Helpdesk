import prisma from './src/db';
async function run() {
  await prisma.user.deleteMany({ where: { email: "admin@example.com" }});
}
run();
