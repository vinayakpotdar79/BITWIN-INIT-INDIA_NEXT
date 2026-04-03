import Groq from "groq-sdk";
import extractJSON from "../utils/extractJson.js";
/**
 * Custom ChatGroq implementation using groq-sdk with LangChain-style interface
 */
class ChatGroq {
  constructor(options = {}) {
    this.client = new Groq({
      apiKey: options.groqApiKey,
    });
    // this.modelName = options.modelName || 'llama-3.3-70b-versatile';
    this.modelName = options.modelName || "qwen/qwen3-32b";
    this.temperature = options.temperature || 0.2;
    this.maxTokens = options.maxTokens || 800;
  }

  async invoke(messages) {
    const groqMessages = messages.map((msg) => ({
      role: msg._getType() === "system" ? "system" : "user",
      content: msg.content,
    }));

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: groqMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    return {
      content: response.choices[0].message.content,
    };
  }
}

function _configureModel() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment variables");
  }

  const llm = new ChatGroq({
    groqApiKey: apiKey,
    modelName: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.2,
    maxTokens: 800,
  });

  return llm;
}

export async function analyzeEmail(emailSubject, emailBody, classification) {
  const llm = _configureModel();

  // Truncate email body to avoid 413 "Request too large" errors
  const MAX_CHARACTERS = 5000;
  const truncatedBody =
    emailBody && emailBody.length > MAX_CHARACTERS
      ? emailBody.substring(0, MAX_CHARACTERS) + "... [Truncated for brevity]"
      : emailBody;

  const systemPrompt = `Analyze email for security:
- Output valid JSON: {explanation, indicators, recommended_steps, resources}
- Be precise and concise. No markdown.`;

  const userPrompt = `Subject: ${emailSubject}
Body: ${truncatedBody}
Class: ${classification}`;

  const messages = [
    { _getType: () => "system", content: systemPrompt },
    { _getType: () => "human", content: userPrompt },
  ];

  try {
    const response = await llm.invoke(messages);
    const text = response.content.trim();

    // try {
    //   return JSON.parse(text);
    // } catch (error) {
    //   return {
    //     raw: text,
    //     note: "Model output was not valid JSON",
    //   };
    // }
    const parsed = extractJSON(text);

    if (parsed) return parsed;

    return {
      explanation: "This email appears suspicious based on its content.",
      indicators: ["Model could not fully structure response"],
      recommended_steps: ["Avoid clicking links", "Verify sender manually"],
      raw: text,
      note: "Fallback used",
    };
  } catch (error) {
    console.error("Error calling Groq API:", error.message);

    // Graceful handling for rate limits
    if (error.message.includes("rate_limit_exceeded") || error.status === 429) {
      return {
        explanation:
          "Detailed analysis currently unavailable due to high system load.",
        indicators: ["Rate limit reached"],
        recommended_steps: ["Try again shortly"],
        note: "Groq API Rate Limit Reached",
      };
    }

    return {
      error: error.message,
      explanation: "Failed to analyze email due to API error",
    };
  }
}

/**
 * Get reasoning from Groq agent about the prediction result
 * @param {string} emailBody - Original email body
 * @param {object} predictionResult - Result from the prediction API
 * @returns {Promise<object>} Reasoning analysis in JSON format
 */
export async function reasonAboutPrediction(emailBody, predictionResult) {
  const llm = _configureModel();

  // Truncate email body to avoid 413 "Request too large" errors
  const MAX_CHARACTERS = 5000;
  const truncatedBody =
    emailBody && emailBody.length > MAX_CHARACTERS
      ? emailBody.substring(0, MAX_CHARACTERS) + "... [Truncated for brevity]"
      : emailBody;

  const isUrl =
    emailBody.startsWith("http://") || emailBody.startsWith("https://");
  const contextType = isUrl ? "Website URL" : "Email Content";

  //   const systemPrompt = `Explain security prediction:
  // - Prediction: ${JSON.stringify(predictionResult)}
  // - Provide JSON: {explanation, indicators, recommended_steps}
  // - Be expert, concise.`;
  const systemPrompt = `
You are a cybersecurity assistant.

STRICT RULES:
- Return ONLY valid JSON
- NO markdown
- NO code blocks
- NO backticks
- NO explanations outside JSON

Output format EXACTLY:
{
  "explanation": "string",
  "indicators": ["string"],
  "recommended_steps": ["string"]
}

Prediction: ${JSON.stringify(predictionResult)}
`;

  // const userPrompt = `${contextType}: ${emailBody}`;
  const userPrompt = `
Analyze this ${contextType} and explain WHY it is phishing.

Content:
${emailBody}
`;

  const messages = [
    { _getType: () => "system", content: systemPrompt },
    { _getType: () => "human", content: userPrompt },
  ];

  try {
    const response = await llm.invoke(messages);
    const text = response.content.trim();

    // try {
    //   return JSON.parse(text);
    // } catch (error) {
    //   return {
    //     raw: text,
    //     note: "Model output was not valid JSON",
    //   };
    // }
    const parsed = extractJSON(text);

    if (parsed) return parsed;

    return {
      explanation: "This email appears suspicious based on its content.",
      indicators: ["Model could not fully structure response"],
      recommended_steps: ["Avoid clicking links", "Verify sender manually"],
      raw: text,
      note: "Fallback used",
    };
  } catch (error) {
    console.error("Error calling Groq API:", error.message);

    // Graceful handling for rate limits
    if (error.message.includes("rate_limit_exceeded") || error.status === 429) {
      return {
        explanation:
          "Detailed analysis currently unavailable due to high system load.",
        indicators: ["Rate limit reached"],
        recommended_steps: ["Refresh later for detailed analysis"],
        note: "Groq API Rate Limit Reached",
      };
    }

    return {
      error: error.message,
      explanation: "Failed to get reasoning due to API error",
    };
  }
}

export async function kavachMitraAgent(userQuery) {
  const llm = _configureModel();

  const systemPrompt = `You are KavachMitra, the official AI cybersecurity assistant for the KavachX platform developed by team BItWin Init.

Your role:
- Answer ONLY questions related to Cyber Security don't give very length response .
- Topics allowed include:
  phishing, malware, ransomware, deepfakes, social engineering,
  data breaches, cyber attacks, authentication, encryption,
  secure coding, network security, AI security, threat detection,
  digital privacy, cyber laws, security best practices.

If the question is NOT related to cybersecurity,
respond with:

"This is not my domain. I am KavachMitra, the cybersecurity assistant of KavachX. I only answer questions related to Cyber Security."

Return output strictly in JSON with the following whenever needed keys:
- topic
- explanation
- prevention_tips
- resources

If the question is outside cybersecurity scope, return JSON with all values containing the above message.

Do NOT include markdown.`;

  const messages = [
    { _getType: () => "system", content: systemPrompt },
    { _getType: () => "human", content: userQuery },
  ];

  try {
    const response = await llm.invoke(messages);
    const text = response.content.trim();

    const parsed = extractJSON(text);
    if (parsed) return parsed;

    return {
      raw: text,
      note: "Model output was not valid JSON",
    };
  } catch (error) {
    console.error("Error in kavachMitraAgent:", error.message);
    return {
      error: error.message,
      explanation: "Failed to process request via Groq",
      topic: "Unknown",
      prevention_tips: [],
      resources: [],
    };
  }
}
