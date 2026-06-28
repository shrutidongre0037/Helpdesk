import prisma from './src/db';

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) return console.log("No users");
  const agent = users[0];
  
  const tickets = await prisma.ticket.findMany();
  if (tickets.length === 0) return console.log("No tickets");
  const ticket = tickets[0];
  
  console.log("Assigning ticket", ticket.id, "to user", agent.id);
  
  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { assignedToId: agent.id },
    include: { assignedTo: true }
  });
  
  console.log("Result:", updated.assignedTo);
}

main().catch(console.error).finally(() => prisma.$disconnect());
