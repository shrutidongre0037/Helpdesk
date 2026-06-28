import prisma from './src/db';

async function test() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }});
  if (!admin) throw new Error("No admin");
  
  const session = await prisma.session.findFirst({ where: { userId: admin.id }});
  const token = session ? session.token : "no-token";
  
  const res = await fetch('http://localhost:3000/api/tickets/2', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Cookie: `better-auth.session_token=${token}` 
    },
    body: JSON.stringify({ assignedToId: admin.id })
  });
  
  console.log("Status:", res.status);
  console.log("Data:", await res.json());
}

test().catch(console.error).finally(() => prisma.$disconnect());
