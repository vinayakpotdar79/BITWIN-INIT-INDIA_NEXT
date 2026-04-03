import axios from "axios";

export async function searchThreats(query) {
  const apiKey = process.env.SERPAPI_KEY;

  try {
    const res = await axios.get("https://serpapi.com/search", {
      params: {
        q: query + " phishing scam cyber attack",
        api_key: apiKey,
        num: 5,
      },
    });

    return res.data.organic_results.map((r) => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link,
    }));
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
}
