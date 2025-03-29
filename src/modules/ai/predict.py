import sys
import numpy as np
import joblib
from transformers import AutoTokenizer

# Kiểm tra input từ dòng lệnh
if len(sys.argv) < 2:
    print("Missing input")
    sys.exit(1)

text = sys.argv[1]

# Load tokenizer, model và scaler
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
model = joblib.load("src/modules/ai/model.pkl")
scaler = joblib.load("src/modules/ai/scaler.pkl")

# Encode văn bản
tokens = tokenizer.encode(text, truncation=True, padding='max_length', max_length=256)
X = np.array([tokens])
X_scaled = scaler.transform(X)

# Dự đoán
pred = model.predict(X_scaled.tolist())[0]

# ❗ In ra duy nhất nhãn (tránh Unicode)
print(pred)
