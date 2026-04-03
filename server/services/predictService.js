import FormData from "form-data";
import fetch from "node-fetch";

export async function predict(emailBody) {
  const predictionUrl = process.env.PREDICTION_API_URL;

  if (!predictionUrl) {
    throw new Error("Missing PREDICTION_API_URL in environment variables");
  }

  try {
    const response = await fetch(predictionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: emailBody }),
    });
    console.log(response);

    if (!response.ok) {
      throw new Error(
        `Prediction API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error calling Prediction API:", error.message);
    throw error;
  }
}

export async function predictURL(urlToScan) {
  const predictionUrl = process.env.URL_PREDICTION_API_URL;

  try {
    const response = await fetch(predictionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlToScan }), // Key must be "url"
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function predictAudio(audioBuffer, fileName) {
  const predictionUrl = process.env.AUDIO_PREDICTION_API_URL;

  try {
    const formData = new FormData();
    // 'file' must match the parameter name in FastAPI: file: UploadFile
    formData.append("file", audioBuffer, fileName);

    const response = await fetch(predictionUrl, {
      method: "POST",
      body: formData,
      // Note: Do NOT set Content-Type header manually when using FormData,
      // the library/fetch will set the boundary for you.
    });

    if (!response.ok) {
      throw new Error(`Audio API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Audio Prediction Error:", error);
    throw error;
  }
}
