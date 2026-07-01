import prisma from "./src/db";

async function check() {
  const ticket = await prisma.ticket.findUnique({
    where: { id: 212 },
    include: { replies: true }
  });
  console.log(JSON.stringify(ticket, null, 2));
}

check();
