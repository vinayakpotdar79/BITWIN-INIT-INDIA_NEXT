export default function extractJSON(text) {
  try {
    // 1. Direct parse
    return JSON.parse(text);
  } catch {}

  try {
    // 2. Extract JSON from code block
    const match = text.match(/```json([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch {}

  try {
    // 3. Extract first JSON object in text
    const match = text.match(/{[\s\S]*}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {}

  return null;
}

export function extractUrls(text) {
  if (!text) return [];

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}
