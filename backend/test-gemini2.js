require('dotenv').config();
const { generateText } = require("ai");
const { createGoogleGenerativeAI } = require("@ai-sdk/google");

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function run() {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-pro'),
      prompt: "Hello",
    });
    console.log("Success:", text);
  } catch(e) {
    console.error("Error:", e);
  }
}

run();
