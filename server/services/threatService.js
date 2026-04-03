import Groq from "groq-sdk";
import { searchThreats } from "./searchService.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function analyzeThreat(userInput) {
  try {
    // 🔍 Step 1: Fetch real-world context
    const searchResults = await searchThreats(userInput);

    // 🧠 Step 2: Send to LLM
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
You are a cybersecurity threat intelligence engine.

STRICT INSTRUCTIONS:
- Use search results as primary source
- Do NOT hallucinate unknown attacks
- Be precise and structured

Return ONLY valid JSON:

{
  "attack_type": "",
  "risk_level": "LOW | MEDIUM | HIGH",
  "confidence": 0.0,
  "similar_attacks": [],
  "indicators": [],
  "explanation": "",
  "recommended_steps": [],
  "sources": []
}
          `,
        },
        {
          role: "user",
          content: `
User Report:
${userInput}

Search Results:
${JSON.stringify(searchResults, null, 2)}
          `,
        },
      ],
    });

    const raw = completion.choices[0].message.content;

    // 🔒 Safe JSON parsing
    try {
      return JSON.parse(raw);
    } catch {
      return {
        error: true,
        raw_response: raw,
      };
    }
  } catch (error) {
    console.error("Groq error:", error.message);
    throw new Error("Threat analysis failed");
  }
}
