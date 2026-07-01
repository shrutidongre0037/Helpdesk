import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: "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"
});

async function main() {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Hello",
    });
    console.log("Success:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
