import prisma from "./src/db";

async function main() {
    const aiAgent = await prisma.user.findUnique({
      where: { email: "ai@helpdesk.local" }
    });
    
    const [totalTickets, openTickets, aiResolved, totalResolved] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ 
        where: { 
          status: "RESOLVED",
          assignedToId: aiAgent ? aiAgent.id : "NO_AI_AGENT"
        } 
      }),
      prisma.ticket.count({ where: { status: "RESOLVED" } })
    ]);
    console.log({ totalTickets, openTickets, aiResolved, totalResolved });
}
main().catch(console.error).finally(() => prisma.$disconnect());
