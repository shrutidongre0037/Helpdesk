import prisma from "./src/db";

async function main() {
  const dailyTicketsRaw = await prisma.$queryRaw<any[]>`
    SELECT DATE("createdAt") as date, COUNT(*)::int as count 
    FROM "ticket" 
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE("createdAt") 
    ORDER BY date ASC
  `;
  
  // Format to ensure all 30 days are present
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Find in raw results
    const found = dailyTicketsRaw.find(r => {
      // In node-postgres, DATE comes back as a JS Date object sometimes, 
      // or as a string depending on timezone. Let's check its type.
      const dStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
      return dStr === dateStr;
    });
    
    result.push({
      date: dateStr,
      count: found ? Number(found.count) : 0
    });
  }
  
  console.log(result.slice(-5)); // Show last 5 days
}

main().catch(console.error).finally(() => prisma.$disconnect());
