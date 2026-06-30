import { PrismaClient, SentType } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const ticketId = 20;
  
  // Check if ticket exists
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  
  if (!ticket) {
    console.error(`Ticket ${ticketId} not found`);
    process.exit(1);
  }

  // Find an agent
  const agent = await prisma.user.findFirst({
    where: { role: 'AGENT', deletedAt: null }
  });
  
  // If no agent, fallback to ADMIN or any user
  const fallbackAgent = await prisma.user.findFirst({
    where: { deletedAt: null }
  });

  const finalAgentId = agent?.id || fallbackAgent?.id || null;

  console.log(`Generating 50 replies for ticket ${ticketId}...`);

  for (let i = 1; i <= 50; i++) {
    const isAgent = i % 2 !== 0;
    const sentType = isAgent ? SentType.AGENT : SentType.CUSTOMER;
    const authorId = isAgent ? finalAgentId : null;
    
    let body = `This is reply number ${i} from the ${sentType}.\n`;
    for (let line = 1; line <= 20; line++) {
        body += `This is filler line ${line} for reply ${i} to make it at least 20 lines long. We are adding more text here so it looks like a real message. The quick brown fox jumps over the lazy dog.\n`;
    }

    await prisma.ticketReply.create({
      data: {
        body,
        ticketId,
        sentType,
        authorId,
      }
    });
    
    console.log(`Created reply ${i}`);
  }
  
  console.log('Done!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
