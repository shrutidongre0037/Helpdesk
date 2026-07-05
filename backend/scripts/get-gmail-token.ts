import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SCOPES = ['https://mail.google.com/'];
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file.");
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const server = http.createServer(async (req, res) => {
  try {
    if (req.url && req.url.startsWith('/oauth2callback')) {
      const q = url.parse(req.url, true).query;
      if (q.error) {
        console.error('Error received:', q.error);
        res.end(`Error: ${q.error}`);
        process.exit(1);
      } else if (q.code) {
        const code = q.code as string;
        try {
          const { tokens } = await oAuth2Client.getToken(code);
          
          console.log('\n--- SUCCESS! ---');
          console.log('Copy the following Refresh Token into your .env file:');
          console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
          console.log('------------------\n');
          
          res.end('Authentication successful! Please check your terminal for the refresh token. You can close this window.');
          server.close();
          process.exit(0);
        } catch (err) {
          console.error("Error exchanging token:", err);
          res.end('Error exchanging token. Check terminal.');
          process.exit(1);
        }
      } else {
        console.log(`Ignored request without code: ${req.url}`);
        res.end('No code found in request.');
      }
    } else {
      res.end('Not found');
    }
  } catch (e: any) {
    res.end('Error: ' + e.message);
    console.error(e);
    server.close();
    process.exit(1);
  }
});

server.listen(3001, () => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('🌐 Please open the following URL in your browser to authorize this app:');
  console.log(authorizeUrl);
  console.log('\n⏳ Waiting for authorization on http://localhost:3001/oauth2callback ...');
});
