import fs from "fs";

const audioPath = "./deepfake_aud.ogg"; // 👈 Replace with your audio file path
const audioBase64 = fs.readFileSync(audioPath, { encoding: "base64" });

const response = await fetch(
  "https://vinayakpotdar79-deep-fake-aud.hf.space/run/predict",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [`data:audio/wav;base64,${audioBase64}`]
    }),
  }
);

const result = await response.json();
console.log("🎙️ Result:", result.data);