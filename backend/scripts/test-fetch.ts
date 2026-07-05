import { google } from "googleapis";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testFetch() {
  const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
  const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error("Missing credentials in .env");
    console.log("ID:", !!CLIENT_ID, "SECRET:", !!CLIENT_SECRET, "TOKEN:", !!REFRESH_TOKEN);
    return;
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    
    console.log("Fetching emails with query: is:unread to:shrutid.enjay@gmail.com");
    let res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread to:shrutid.enjay@gmail.com',
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      console.log("No messages found for 'is:unread to:shrutid.enjay@gmail.com'.");
      
      console.log("Trying broader query: 'is:unread'");
      res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
      });
      if (!res.data.messages || res.data.messages.length === 0) {
        console.log("Still no messages found for 'is:unread'. Exiting.");
        return;
      }
    }

    const messages = res.data.messages;
    console.log(`Found ${messages.length} unread emails. Processing first one...`);

    const message = messages[0];
    if (!message.id) return;

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
      console.log("Sender:", senderEmail, "Name:", senderName, "Subject:", subject);
      console.log("Success! The email is parseable.");
    }
  } catch (err: any) {
    console.error("Error fetching Gmail:", err.message);
  }
}

testFetch();
