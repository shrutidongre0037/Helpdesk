require('dotenv').config();

async function run() {
  try {
    const ai = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
    const data = await ai.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}

run();
