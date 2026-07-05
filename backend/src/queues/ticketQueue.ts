import { PgBoss } from "pg-boss";
import prisma from "../db";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { simpleParser } from "mailparser";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/helpdesk?schema=public";

export const boss = new PgBoss(databaseUrl);

const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

boss.on('error', (error: Error) => console.error('pg-boss error:', error));

export async function setupTicketQueue() {
  await boss.start();
  console.log("pg-boss started successfully");

  await boss.createQueue("classify-ticket");
  await boss.createQueue("fetch-gmail");

  await boss.work("fetch-gmail", async () => {
    const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
      return;
    }

    try {
      const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
      oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread to:shrutid.enjay@gmail.com newer_than:1d',
        maxResults: 10,
      });

      const messages = res.data.messages || [];
      if (messages.length === 0) return;

      console.log(`Found ${messages.length} unread emails. Processing...`);

      for (const message of messages) {
        if (!message.id) continue;

        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'raw',
        });

        if (msgRes.data.raw) {
          const rawEmail = Buffer.from(msgRes.data.raw, 'base64').toString('utf-8');
          const parsedEmail = await simpleParser(rawEmail);

          const sender = parsedEmail.from?.value[0];
          const senderEmail = sender?.address || "unknown@email.local";
          const senderName = sender?.name || senderEmail;
          const subject = parsedEmail.subject || "No Subject";
          const body = parsedEmail.text || parsedEmail.html || "No Content";

          console.log(`Processing email from ${senderEmail}: ${subject}`);

          const ticket = await prisma.ticket.create({
            data: {
              subject,
              description: body,
              senderEmail,
              senderName,
              status: "NEW",
            },
          });

          console.log(`Created ticket ${ticket.id} from email.`);

          await boss.send("classify-ticket", { ticketId: ticket.id });

          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching Gmail:", error);
    }
  });

  await boss.schedule("fetch-gmail", "* * * * *");

  await boss.work("classify-ticket", async (jobs: any) => {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobArray) {
      // Sleep for 10 seconds before processing each ticket to respect Gemini Free Tier limits (15 RPM)
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const { ticketId } = job.data as { ticketId: number };
        
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
        });

        if (!ticket) {
          throw new Error(`Ticket ${ticketId} not found`);
        }

        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "PROCESSING" },
        });
        console.log(`Ticket ${ticketId} status set to PROCESSING...`);

        const kbPath = path.resolve(process.cwd(), '../knowledge-base.md');
        let kbContent = '';
        try {
          kbContent = fs.readFileSync(kbPath, 'utf8');
        } catch (e) {
          console.warn('Could not read knowledge-base.md', e);
        }

        console.log(`Attempting auto-resolution for ticket ${ticketId}...`);
        
        const customerFirstName = (ticket.senderName || "").split(" ")[0] || "Customer";

        const resolutionPrompt = `You are an AI support agent. Your task is to resolve the user's ticket based ONLY on the provided Knowledge Base.
If you can answer the user's query confidently using ONLY the Knowledge Base, provide the helpful response. 
If you cannot answer the query using the Knowledge Base, or if it requires human intervention (like refunds, account deletion, etc.), reply with EXACTLY the word "UNRESOLVED" and nothing else.

When generating a response:
- Maintain a professional, empathetic, and customer-friendly tone.
- Format your response clearly.
- Address the customer by their first name: "${customerFirstName}".
- Sign off the email with "Enjay IT Solutions Support".

Knowledge Base:
${kbContent}

Ticket Subject: ${ticket.subject}
Ticket Description: ${ticket.description}

Response:`;

        const { text: resolutionText } = await generateText({
          model: googleAI("gemini-2.5-flash"),
          prompt: resolutionPrompt,
        });

        const resolutionResponse = resolutionText.trim();

        if (resolutionResponse !== "UNRESOLVED") {
          console.log(`Ticket ${ticketId} auto-resolved.`);
          
          const aiAgent = await prisma.user.findUnique({
            where: { email: "ai@helpdesk.local" }
          });
          
          await prisma.$transaction([
            prisma.ticketReply.create({
              data: {
                ticketId,
                body: resolutionResponse,
                sentType: "AGENT",
                authorId: aiAgent ? aiAgent.id : null,
              },
            }),
            prisma.ticket.update({
              where: { id: ticketId },
              data: { status: "RESOLVED" },
            }),
          ]);
          
          continue; // Skip classification and move to next job
        }

        console.log(`Ticket ${ticketId} could not be auto-resolved. Falling back to classification...`);

        const prompt = `You are a customer support agent. Categorize the following ticket into EXACTLY ONE of these categories: TECHNICAL, GENERAL, or REFUND.
Do not output anything else besides the exact word TECHNICAL, GENERAL, or REFUND.

Subject: ${ticket.subject}
Description: ${ticket.description}

Category:`;

        const { text } = await generateText({
          model: googleAI("gemini-2.5-flash"),
          prompt,
        });

        const category = text.trim().toUpperCase();

        let finalCategory: "TECHNICAL" | "GENERAL" | "REFUND" | null = null;
        if (["TECHNICAL", "GENERAL", "REFUND"].includes(category)) {
          finalCategory = category as any;
        }

        const updateData: any = { status: "OPEN", assignedToId: null };
        if (finalCategory) {
          updateData.category = finalCategory;
        }

        await prisma.ticket.update({
          where: { id: ticketId },
          data: updateData,
        });
        
        if (finalCategory) {
          console.log(`Ticket ${ticketId} classified as: ${finalCategory} and opened.`);
        } else {
          console.log(`Ticket ${ticketId} could not be classified. AI returned: ${category}. Ticket opened.`);
        }
      } catch (err: any) {
        console.error(`Job classify-ticket failed with error:`, err.message);
        throw err;
      }
    }
  });
}
