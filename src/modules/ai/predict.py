import sys
import numpy as np
import joblib
from transformers import AutoTokenizer

if len(sys.argv) < 2:
    print("❌ Thiếu câu đầu vào.")
    sys.exit(1)

text = sys.argv[1]

# Load tokenizer và model
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
model = joblib.load("src/modules/ai/model.pkl")

# Encode
tokens = tokenizer.encode(text, truncation=True, padding='max_length', max_length=256)
X = np.array([tokens])

# Dự đoán
pred = model.predict(X.tolist())[0]
print(f"✅ Dự đoán nhãn: {pred}")
