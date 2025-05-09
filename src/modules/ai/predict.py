import sys
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# === Lấy đường dẫn model đúng chuẩn ===
MODEL_DIR = Path(__file__).parent / "phobert-weighted" / "checkpoint-75"
MODEL_DIR = str(MODEL_DIR.resolve(strict=True))  # ✅ ép kiểu và resolve tuyệt đối

# Kiểm tra thư mục mô hình
if not Path(MODEL_DIR).exists():
    raise FileNotFoundError(f"Thư mục mô hình không tồn tại: {MODEL_DIR}")

# Kiểm tra tệp mô hình
required_files = ["model.safetensors", "config.json", "tokenizer_config.json"]
for file in required_files:
    if not (Path(MODEL_DIR) / file).exists():
        raise FileNotFoundError(f"Tệp mô hình bị thiếu: {file}")

# === Load tokenizer & model (local only, KHÔNG gọi HuggingFace Hub) ===
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR, local_files_only=True)
model.eval()

# === Check input từ dòng lệnh ===
if len(sys.argv) < 2:
    print("Vui lòng nhập một câu để dự đoán.")
    sys.exit(1)

text = sys.argv[1]

# === Tokenize input ===
inputs = tokenizer(
    text,
    truncation=True,
    padding="max_length",
    max_length=256,
    return_tensors="pt"
)

# === Dự đoán với mô hình ===
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=1).item()

# === In kết quả rõ nghĩa ===
labels = {0: "Tiêu cực", 1: "Bình thường", 2: "Tích cực"}
result_str = f"{predicted_class} - {labels.get(predicted_class, 'Không rõ')}\n"
sys.stdout.buffer.write(result_str.encode("utf-8"))