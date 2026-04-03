from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
import io
import cv2
import numpy as np
import os

from transformers import AutoImageProcessor, AutoModelForImageClassification

app = FastAPI()

# ✅ Enable CORS (for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 Load model ONCE
model_name = "dima806/deepfake_vs_real_image_detection"

processor = AutoImageProcessor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(model_name)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

print("Model labels:", model.config.id2label)


# 🧠 Helper: Predict single image
def predict_image(image: Image.Image):
    inputs = processor(images=image, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    probs = torch.nn.functional.softmax(logits, dim=-1)

    pred_id = logits.argmax(-1).item()
    raw_label = model.config.id2label[pred_id]
    confidence = probs[0][pred_id].item()

    # 🔥 Normalize label
    label = raw_label.lower()

    if "fake" in label:
        final_label = "FAKE"
    elif "real" in label:
        final_label = "REAL"
    else:
        final_label = "UNKNOWN"

    return final_label, confidence


# 📸 Image Endpoint
@app.post("/predict/image")
async def predict_image_api(file: UploadFile = File(...)):
    image_bytes = await file.read()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    label, confidence = predict_image(image)

    return {
        "type": "image",
        "prediction": label,
        "confidence": confidence
    }


# 🎥 Video Endpoint
@app.post("/predict/video")
async def predict_video_api(file: UploadFile = File(...)):
    video_bytes = await file.read()

    temp_path = "temp_video.mp4"

    # Save temp video
    with open(temp_path, "wb") as f:
        f.write(video_bytes)

    cap = cv2.VideoCapture(temp_path)

    predictions = []
    processed_frames = 0
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()

        if not ret:
            break

        if frame is None:
            continue

        # ⏩ Sample every 10th frame
        if frame_count % 10 == 0:
            try:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(frame_rgb)

                label, _ = predict_image(image)

                print(f"Frame {frame_count}: {label}")  # debug

                if label in ["FAKE", "REAL"]:
                    predictions.append(label)
                    processed_frames += 1

            except Exception as e:
                print("Frame processing error:", e)

        frame_count += 1

    cap.release()

    # Cleanup temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)

    # 🧠 Aggregation
    fake_count = predictions.count("FAKE")
    real_count = predictions.count("REAL")

    if processed_frames == 0:
        final = "UNKNOWN"
    else:
        final = "FAKE" if fake_count > real_count else "REAL"

    return {
        "type": "video",
        "final_prediction": final,
        "fake_frames": fake_count,
        "real_frames": real_count,
        "total_sampled_frames": processed_frames
    }