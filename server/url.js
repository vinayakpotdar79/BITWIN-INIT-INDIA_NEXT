import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config()
// Check for API token
if (!process.env.HF_TOKEN) {
  throw new Error("HF_TOKEN environment variable is not set.");
}
console.log("✅ HF_TOKEN found, proceeding with inference...");
const client = new InferenceClient(process.env.HF_TOKEN);

const url = "https://github.com/vinayakpotdar79?tab=repositories"; // 👈 Replace with your URL

try {
  const output = await client.textClassification({
    model: "ealvaradob/bert-finetuned-phishing",
    inputs: url,
    provider: "hf-inference",
  });

  // Parse and display result cleanly
  const result = output[0];
  console.log("🔍 URL Analyzed:", url);
  console.log("🏷️  Label:", result.label);
  console.log("📊 Confidence:", (result.score * 100).toFixed(2) + "%");
  console.log(
    result.label === "phishing"
      ? "🚨 WARNING: This URL is likely PHISHING!"
      : "✅ This URL appears LEGITIMATE."
  );
} catch (error) {
  console.error("❌ Error during classification:", error.message);
}