import prisma from "./src/db";
async function main() {
  try {
    const result = await prisma.$queryRaw<any[]>`SELECT get_dashboard_metrics('ai@helpdesk.local') as metrics`;
    console.log(JSON.stringify(result[0].metrics, null, 2));
  } catch(e) {
    console.error("ERROR", e);
  }
}
main().finally(() => prisma.$disconnect());
