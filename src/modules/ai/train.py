import os
import pandas as pd
import torch
import numpy as np
import argparse
import sys
import time
sys.stdout.reconfigure(encoding='utf-8')
os.environ["TRANSFORMERS_NO_TF"] = "1"
from transformers import TrainerCallback
import json

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score
from sklearn.utils.class_weight import compute_class_weight
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)

# === 1. Đường dẫn file tham số ===
PARAMS_PATH = os.path.join(os.path.dirname(__file__), "train_params.json")
if not os.path.exists(PARAMS_PATH):
    raise FileNotFoundError(f"File tham số không tồn tại: {PARAMS_PATH}")

# === 2. Đọc tham số từ file JSON ===
with open(PARAMS_PATH, "r") as f:
    params = json.load(f)

epochs = int(params.get("epochs", 3))  # Chuyển đổi sang số nguyên
batch_size = int(params.get("batch_size", 16))  # Chuyển đổi sang số nguyên
learning_rate = float(params.get("learning_rate", 2e-5))  # Chuyển đổi sang số thực
train_subset = int(params.get("train_subset", None)) if params.get("train_subset") is not None else None

# === 3. Load & chuẩn bị dữ liệu ===
DATA_PATH = os.path.join(os.path.dirname(__file__), "data")
df_train = pd.read_csv(os.path.join(DATA_PATH, "train_product_feedback.csv"))
df_val = pd.read_csv(os.path.join(DATA_PATH, "validation_product_feedback.csv"))
df_test = pd.read_csv(os.path.join(DATA_PATH, "test_product_feedback.csv"))

df = pd.concat([df_train, df_val, df_test]).dropna().reset_index(drop=True)
df = df[["comment", "label"]]

train_subset = int(train_subset) if train_subset is not None else None

# ⚠️ Dùng subset để demo nếu được chỉ định
if train_subset:
    df = df.sample(train_subset, random_state=42).reset_index(drop=True)

train_df, val_df = train_test_split(df, test_size=0.2, stratify=df["label"], random_state=42)
train_ds = Dataset.from_pandas(train_df)
val_ds = Dataset.from_pandas(val_df)

# === 4. Tokenizer PhoBERT ===
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base", use_fast=False)

def preprocess(batch):
    return tokenizer(batch["comment"], truncation=True, padding='max_length', max_length=256)

train_ds = train_ds.map(preprocess, batched=True).rename_column("label", "labels")
val_ds = val_ds.map(preprocess, batched=True).rename_column("label", "labels")

train_ds.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])
val_ds.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])

# === 5. Tính trọng số class (weighted loss) ===
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_df["label"]),
    y=train_df["label"]
)
weights = torch.tensor(class_weights, dtype=torch.float)

# === 6. Khởi tạo model PhoBERT ===
model = AutoModelForSequenceClassification.from_pretrained("vinai/phobert-base", num_labels=3)

# === 7. Custom Trainer dùng weighted loss ===
class WeightedTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.get("labels")
        outputs = model(**inputs)
        logits = outputs.get("logits")
        loss_fn = torch.nn.CrossEntropyLoss(weight=weights.to(model.device))
        loss = loss_fn(logits, labels)
        return (loss, outputs) if return_outputs else loss



class TrainingProgressCallback(TrainerCallback):
    def __init__(self, total_epochs):
        self.total_epochs = total_epochs
        self.progress_path = os.path.join(os.path.dirname(__file__), "training_progress.json")

    def on_train_begin(self, args, state, control, **kwargs):
        # Ghi thông tin khi bắt đầu huấn luyện
        progress = {
            "current_epoch": 0,
            "total_epochs": self.total_epochs,
            "percent": 0,
            "loss": None,
            "start_time": time.strftime('%Y-%m-%d %H:%M:%S'),
            "end_time": None,
            "status": "training"
        }
        with open(self.progress_path, "w") as f:
            json.dump(progress, f)

    def on_epoch_end(self, args, state, control, **kwargs):
        # Ghi thông tin sau mỗi epoch
        current_epoch = int(state.epoch)
        loss = state.log_history[-1].get('loss', 'N/A') if state.log_history else "N/A"
        progress = {
            "current_epoch": current_epoch,
            "total_epochs": self.total_epochs,
            "percent": round((current_epoch / self.total_epochs) * 100, 2),
            "loss": loss,
            "start_time": None,
            "end_time": None,
            "status": "training"
        }
        with open(self.progress_path, "w") as f:
            json.dump(progress, f)

    def on_train_end(self, args, state, control, **kwargs):
        # Ghi thông tin khi hoàn thành huấn luyện
        loss = state.log_history[-1].get('loss', 'N/A') if state.log_history else "N/A"
        progress = {
            "current_epoch": self.total_epochs,
            "total_epochs": self.total_epochs,
            "percent": 100,
            "loss": loss,
            "start_time": None,
            "end_time": time.strftime('%Y-%m-%d %H:%M:%S'),
            "status": "completed"
        }
        with open(self.progress_path, "w") as f:
            json.dump(progress, f)

# === 8. Training Arguments ===
training_args = TrainingArguments(
    output_dir=os.path.join(os.path.dirname(__file__), "phobert-weighted"),
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_strategy="epoch",
    per_device_train_batch_size=batch_size,
    per_device_eval_batch_size=32,
    num_train_epochs=epochs,
    learning_rate=learning_rate,
    save_total_limit=1,
    load_best_model_at_end=True,
    metric_for_best_model="eval_f1",
    logging_dir=os.path.join(os.path.dirname(__file__), "logs"),
    report_to="none"
)

# === 9. Metric đánh giá ===
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = torch.argmax(torch.tensor(logits), dim=-1).numpy()

    # Tính toán các metric
    f1 = f1_score(labels, preds, average='weighted')
    precision = precision_score(labels, preds, average='weighted')
    recall = recall_score(labels, preds, average='weighted')
    accuracy = (preds == labels).mean()

    # Log các metric
    print(f"=== Đánh giá ===")
    print(f"F1 Score: {f1:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"Accuracy: {accuracy:.4f}")

    return {
        "eval_f1": f1,
        "eval_precision": precision,
        "eval_recall": recall,
        "eval_accuracy": accuracy,
    }

# === 10. Huấn luyện mô hình ===
trainer = WeightedTrainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=val_ds,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
    callbacks=[TrainingProgressCallback(epochs)],
)

print("Bat dau huan luyen...")  # Thay thế ký tự Unicode bằng ASCII
trainer.train()
print("Huấn luyện hoàn tất.")

# === 11. Lưu model & tokenizer chuẩn chỉnh ===
SAVE_DIR = os.path.join(os.path.dirname(__file__), "phobert-weighted")
model.save_pretrained(SAVE_DIR)
tokenizer.save_pretrained(SAVE_DIR)
print(f"Mô hình và tokenizer đã lưu tại: {SAVE_DIR}")
