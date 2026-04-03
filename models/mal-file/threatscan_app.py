import streamlit as st
import os
import math
import json
import hashlib
import mimetypes
import re
import base64
from collections import Counter

# External libs
import yara
import pefile

# LangChain + Groq
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

st.set_page_config(page_title="ThreatScan PRO", page_icon="🛡️")

# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
SUSPICIOUS_EXTENSIONS = {
    'exe', 'dll', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'hta', 'jar',
    'msi', 'scr', 'pif', 'com', 'lnk', 'reg', 'wsf', 'docm',
    'xlsm', 'pptm'
}

SCRIPT_PATTERNS = [
    r'eval\s*\(', r'exec\s*\(', r'powershell', r'cmd\.exe',
    r'base64', r'fromCharCode', r'<script', r'WScript',
]

# ─────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────
def compute_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    freq = Counter(data)
    total = len(data)
    return -sum((c/total) * math.log2(c/total) for c in freq.values())

def get_magic_bytes(data):
    return ' '.join(f'{b:02x}' for b in data[:16])

def extract_strings(data):
    return re.findall(rb"[ -~]{4,}", data)

def detect_base64(text):
    matches = re.findall(r'[A-Za-z0-9+/=]{20,}', text)
    decoded = []
    for m in matches:
        try:
            decoded.append(base64.b64decode(m).decode('utf-8', errors='ignore'))
        except:
            pass
    return decoded

# ─────────────────────────────────────────────────────────────
# YARA RULES (basic)
# ─────────────────────────────────────────────────────────────
YARA_RULES = """
rule SuspiciousStrings {
    strings:
        $a = "cmd.exe"
        $b = "powershell"
        $c = "eval("
    condition:
        any of them
}
"""

rules = yara.compile(source=YARA_RULES)

# ─────────────────────────────────────────────────────────────
# PE ANALYSIS (EXE)
# ─────────────────────────────────────────────────────────────
def analyze_pe(file_bytes):
    try:
        pe = pefile.PE(data=file_bytes)
        return {
            "entry_point": hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint),
            "sections": [s.Name.decode().strip() for s in pe.sections],
            "imports": [entry.dll.decode() for entry in pe.DIRECTORY_ENTRY_IMPORT]
        }
    except:
        return {}

# ─────────────────────────────────────────────────────────────
# MAIN ANALYSIS
# ─────────────────────────────────────────────────────────────
def analyze_file(uploaded_file):
    raw = uploaded_file.read()
    uploaded_file.seek(0)

    name = uploaded_file.name
    extension = name.split('.')[-1].lower() if '.' in name else ''

    entropy = compute_entropy(raw)
    magic = get_magic_bytes(raw)

    text = raw.decode('utf-8', errors='ignore')

    strings = extract_strings(raw)
    base64_decoded = detect_base64(text)

    yara_matches = rules.match(data=raw)

    pe_info = analyze_pe(raw) if extension == "exe" else {}

    return {
        "name": name,
        "size": len(raw),
        "extension": extension,
        "entropy": entropy,
        "magic_bytes": magic,
        "is_suspicious_ext": extension in SUSPICIOUS_EXTENSIONS,
        "script_hits": [p for p in SCRIPT_PATTERNS if re.search(p, text)],
        "strings_sample": [s.decode(errors='ignore') for s in strings[:10]],
        "base64_decoded_sample": base64_decoded[:3],
        "yara_hits": [str(m) for m in yara_matches],
        "pe_info": pe_info,
        "md5": hashlib.md5(raw).hexdigest()
    }

# ─────────────────────────────────────────────────────────────
# AI ANALYSIS
# ─────────────────────────────────────────────────────────────
def call_groq(data):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return {"verdict": "ERROR", "reason": "Missing API key"}

    llm = ChatGroq(
        groq_api_key=api_key,
        model_name="llama-3.3-70b-versatile",
        temperature=0
    )

    prompt = f"""
You are a malware analysis AI.

Analyze:

{json.dumps(data, indent=2)}

Return JSON:
{{
 "threatScore": 0-100,
 "verdict": "SAFE|SUSPICIOUS|MALICIOUS",
 "reasoning": "",
 "recommendation": ""
}}
"""

    res = llm.invoke([HumanMessage(content=prompt)])
    try:
        return json.loads(res.content)
    except:
        return {"verdict": "ERROR", "reason": res.content}

# ─────────────────────────────────────────────────────────────
# UI
# ─────────────────────────────────────────────────────────────
def main():
    st.title("🛡 ThreatScan PRO (Advanced Malware Analyzer)")

    uploaded = st.file_uploader("Upload any file")

    if uploaded:
        st.info("Running deep static analysis...")

        data = analyze_file(uploaded)
        st.json(data)

        if st.button("Run AI Threat Analysis"):
            result = call_groq(data)

            st.subheader("Verdict")
            st.write(result)

# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    main()