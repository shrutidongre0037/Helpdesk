import { PgBoss } from "pg-boss";
import prisma from "../db";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/helpdesk?schema=public";

export const boss = new PgBoss(databaseUrl);

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

boss.on('error', (error: Error) => console.error('pg-boss error:', error));

export async function setupTicketQueue() {
  await boss.start();
  console.log("pg-boss started successfully");

  await boss.createQueue("classify-ticket");

  await boss.work("classify-ticket", async (jobs: any) => {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobArray) {
      try {
        const { ticketId } = job.data as { ticketId: number };
        
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
        });

        if (!ticket) {
          throw new Error(`Ticket ${ticketId} not found`);
        }

        console.log(`Classifying ticket ${ticketId}...`);

        const prompt = `You are a customer support agent. Categorize the following ticket into EXACTLY ONE of these categories: TECHNICAL, GENERAL, or REFUND.
Do not output anything else besides the exact word TECHNICAL, GENERAL, or REFUND.

Subject: ${ticket.subject}
Description: ${ticket.description}

Category:`;

        const { text } = await generateText({
          model: google("gemini-2.5-flash"),
          prompt,
        });

        const category = text.trim().toUpperCase();

        let finalCategory: "TECHNICAL" | "GENERAL" | "REFUND" | null = null;
        if (["TECHNICAL", "GENERAL", "REFUND"].includes(category)) {
          finalCategory = category as any;
        }

        if (finalCategory) {
          await prisma.ticket.update({
            where: { id: ticketId },
            data: { category: finalCategory },
          });
          console.log(`Ticket ${ticketId} classified as: ${finalCategory}`);
        } else {
          console.log(`Ticket ${ticketId} could not be classified. AI returned: ${category}`);
        }
      } catch (err: any) {
        console.error(`Job classify-ticket failed with error:`, err.message);
        throw err;
      }
    }
  });
}
