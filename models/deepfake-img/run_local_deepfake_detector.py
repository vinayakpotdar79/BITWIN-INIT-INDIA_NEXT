import gradio as gr
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import os

# --- 1) Local model path (change if needed) ---
MODEL_DIR = r"e:\Aindnxt\BITWIN-INIT-INDIA_NEXT\models\deepfake-img\Deep-Fake-Detector-v2-Model"

# --- 2) Load model + processor from local folder ---
processor = AutoImageProcessor.from_pretrained(MODEL_DIR)
model = AutoModelForImageClassification.from_pretrained(MODEL_DIR)

# --- 3) Ensure label mapping matches the model ---
# The model config already contains id2label, but you can override if needed:
id2label = {
    "0": "fake",
    "1": "real"
}

def classify_image(image):
    # Gradio gives numpy arrays; convert to PIL
    image = Image.fromarray(image).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()

    prediction = {id2label[str(i)]: round(probs[i], 3) for i in range(len(probs))}
    return prediction

# --- 4) Gradio UI ---
iface = gr.Interface(
    fn=classify_image,
    inputs=gr.Image(type="numpy"),
    outputs=gr.Label(num_top_classes=2, label="Deepfake Classification"),
    title="BitWin's Deepfake Detector - IndiaNext",
    description="Upload an image to classify whether it is real or fake."
)

if __name__ == "__main__":
    iface.launch()