from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = FastAPI()

# 1. SWAP MODEL ID HERE
# Option A: dima806/phishing-email-detection (Good for Phishing)
# Option B: AntiSpamInstitute/spam-detector-bert-MoE-v2.2 (Good for Spam)
MODEL_ID = "dima806/phishing-email-detection"

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID)

class EmailInput(BaseModel):
    text: str

@app.post("/")
async def testingFunction():
    return "Api working fine..."

@app.post("/predict")
async def predict_email(data: EmailInput):
    # PRE-PROCESS: Handle very short text manually to avoid "Model Hallucinations"
    if len(data.text.strip().split()) < 3:
        return {"prediction": "legitimate", "confidence": 1.0, "is_phishing": False, "note": "Text too short for analysis"}

    inputs = tokenizer(data.text, return_tensors="pt", truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    
    probs = predictions[0].tolist()
    
    # 2. DYNAMIC LABEL MAPPING
    # This automatically gets labels like 'LABEL_0', 'phishing', etc., from the model config
    confidences = {model.config.id2label[i]: prob for i, prob in enumerate(probs)}
    
    # Determine the top result
    max_label = max(confidences.items(), key=lambda x: x[1])
    
    return {
        "prediction": max_label[0],
        "confidence": round(max_label[1], 4),
        "all_scores": confidences,
        "is_phishing": "phishing" in max_label[0].lower() or "spam" in max_label[0].lower()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)