import prisma from "./src/db";

async function main() {
  const t = await prisma.ticket.findUnique({
    where: { id: 214 },
    include: { replies: true }
  });
  console.log(JSON.stringify(t, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
