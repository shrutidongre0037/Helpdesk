import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: "AQ.Ab8RN6K-CUuoVhwNPdsmMwG7qYF-3Ma5rOUiRWvnKMidZNINPg",
});

async function main() {
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: "Hello",
    });
    console.log("Success:", text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
