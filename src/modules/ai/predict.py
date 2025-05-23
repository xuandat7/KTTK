import sys
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import logging
import os
import argparse

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def predict_sentiment(text: str, model_path: str) -> str:
    # Chuyển đổi đường dẫn tương đối thành tuyệt đối nếu cần
    if not os.path.isabs(model_path):
        model_path = os.path.join(os.path.dirname(__file__), model_path)
    
    logger.info(f"Đang dự đoán với model tại: {model_path}")
    
    # Kiểm tra thư mục mô hình
    model_dir = Path(model_path)
    if not model_dir.exists():
        error_msg = f"Thư mục mô hình không tồn tại: {model_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    # Kiểm tra tệp mô hình
    required_files = ["model.safetensors", "config.json", "tokenizer_config.json"]
    missing_files = []
    for file in required_files:
        file_path = model_dir / file
        if not file_path.exists():
            missing_files.append(file)
            logger.error(f"Không tìm thấy file: {file_path}")
    
    if missing_files:
        error_msg = f"Thiếu các tệp mô hình: {', '.join(missing_files)}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    logger.info("Đang load tokenizer và model...")
    # Load tokenizer & model
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
        model = AutoModelForSequenceClassification.from_pretrained(model_path, local_files_only=True)
        model.eval()
    except Exception as e:
        error_msg = f"Lỗi khi load model: {str(e)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    logger.info("Đang tokenize input...")
    # Tokenize input
    inputs = tokenizer(
        text,
        truncation=True,
        padding="max_length",
        max_length=256,
        return_tensors="pt"
    )

    logger.info("Đang thực hiện dự đoán...")
    # Dự đoán
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        predicted_class = torch.argmax(logits, dim=1).item()

    # Trả về kết quả
    labels = {0: "Tiêu cực", 1: "Bình thường", 2: "Tích cực"}
    result = f"{predicted_class} - {labels.get(predicted_class, 'Không rõ')}"
    logger.info(f"Kết quả dự đoán: {result}")
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict sentiment from text.")
    parser.add_argument("--text", type=str, required=True, help="Input text for sentiment prediction")
    parser.add_argument("--model_path", type=str, required=True, help="Path to the sentiment model")

    args = parser.parse_args()

    text = args.text
    model_path = args.model_path

    try:
        result = predict_sentiment(text, model_path)
        sys.stdout.buffer.write(result.encode("utf-8"))
    except Exception as e:
        logger.error(f"Lỗi: {str(e)}")
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)