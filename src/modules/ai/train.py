import os
import pandas as pd
import torch
import numpy as np
import argparse
import sys
import time
import json
import io
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score
from sklearn.utils.class_weight import compute_class_weight
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    TrainerCallback
)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
# === 1. Nhận tham số từ dòng lệnh ===
parser = argparse.ArgumentParser(description="Train a machine learning model.")
parser.add_argument("--epochs", type=int, required=True, help="Number of epochs")
parser.add_argument("--batch_size", type=int, required=True, help="Batch size")
parser.add_argument("--learning_rate", type=float, required=True, help="Learning rate")
parser.add_argument("--train_subset", type=int, required=False, help="Subset of training data")
parser.add_argument("--dataset", type=str, required=True, help="Path to the dataset")
args = parser.parse_args()

# === 2. Sử dụng tham số từ dòng lệnh ===
epochs = args.epochs
batch_size = args.batch_size
learning_rate = args.learning_rate
train_subset = args.train_subset
dataset_file = args.dataset

# === 3. Load & chuẩn bị dữ liệu ===
DATA_PATH = os.path.dirname(dataset_file)
df_train = pd.read_csv(dataset_file)  # Đọc file từ đường dẫn được truyền
df_train = df_train.dropna().reset_index(drop=True)

if train_subset:
    df_train = df_train.sample(train_subset, random_state=42).reset_index(drop=True)

train_df, val_df = train_test_split(df_train, test_size=0.2, stratify=df_train["label"], random_state=42)
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
            "status": "training",
            "metrics": {}
        }
        with open(self.progress_path, "w") as f:
            json.dump(progress, f)

    def on_epoch_end(self, args, state, control, **kwargs):
        # Ghi thông tin sau mỗi epoch
        current_epoch = int(state.epoch) if state.epoch is not None else 0
        loss = state.log_history[-1].get('loss', 'N/A') if state.log_history else "N/A"

        # Lấy thông số đánh giá từ log cuối cùng
        eval_metrics = next((log for log in state.log_history if 'eval_f1' in log), {})
        train_metrics = next((log for log in state.log_history if 'loss' in log and 'epoch' in log), {})

        metrics = {
            "eval_f1": eval_metrics.get('eval_f1', 'N/A'),
            "eval_precision": eval_metrics.get('eval_precision', 'N/A'),
            "eval_recall": eval_metrics.get('eval_recall', 'N/A'),
            "eval_accuracy": eval_metrics.get('eval_accuracy', 'N/A'),
            "eval_loss": eval_metrics.get('eval_loss', 'N/A'),
            "eval_runtime": eval_metrics.get('eval_runtime', 'N/A'),
            "eval_samples_per_second": eval_metrics.get('eval_samples_per_second', 'N/A'),
            "eval_steps_per_second": eval_metrics.get('eval_steps_per_second', 'N/A'),
            "train_loss": train_metrics.get('loss', 'N/A'),
            "grad_norm": train_metrics.get('grad_norm', 'N/A'),
            "learning_rate": train_metrics.get('learning_rate', 'N/A'),
            "epoch": current_epoch,
        }

        progress = {
            "current_epoch": current_epoch,
            "total_epochs": self.total_epochs,
            "percent": round((current_epoch / self.total_epochs) * 100, 2),
            "loss": metrics.get('train_loss', 'N/A'),
            "start_time": state.log_history[0].get('start_time', None) if state.log_history else None,
            "end_time": time.strftime('%Y-%m-%d %H:%M:%S') if state.log_history else None,
            "status": "training",
            "metrics": metrics
        }

        # Ghi thông tin vào file JSON
        with open(self.progress_path, "w") as f:
            json.dump(progress, f)

    def on_train_end(self, args, state, control, **kwargs):
        # Ghi thông tin khi hoàn thành huấn luyện
        current_epoch = int(state.epoch) if state.epoch is not None else 0
        loss = state.log_history[-1].get('loss', 'N/A') if state.log_history else "N/A"
        
        eval_metrics = next((log for log in state.log_history if 'eval_f1' in log), {})
        train_metrics = next((log for log in state.log_history if 'train_loss' in log), {})
        
        metrics = {
        "eval_f1": eval_metrics.get('eval_f1', 'N/A'),
        "eval_precision": eval_metrics.get('eval_precision', 'N/A'),
        "eval_recall": eval_metrics.get('eval_recall', 'N/A'),
        "eval_accuracy": eval_metrics.get('eval_accuracy', 'N/A'),
        "eval_loss": eval_metrics.get('eval_loss', 'N/A'),
        "eval_runtime": eval_metrics.get('eval_runtime', 'N/A'),
        "eval_samples_per_second": eval_metrics.get('eval_samples_per_second', 'N/A'),
        "eval_steps_per_second": eval_metrics.get('eval_steps_per_second', 'N/A'),
        "train_runtime": train_metrics.get('train_runtime', 'N/A'),
        "train_samples_per_second": train_metrics.get('train_samples_per_second', 'N/A'),
        "train_steps_per_second": train_metrics.get('train_steps_per_second', 'N/A'),
        "train_loss": train_metrics.get('train_loss', 'N/A'),
        "epoch": current_epoch,
    }
        progress = {
            "current_epoch": self.total_epochs,
            "total_epochs": self.total_epochs,
            "percent": 100,
            "loss": metrics.get('train_loss', 'N/A'),
            "start_time": None,
            "end_time": time.strftime('%Y-%m-%d %H:%M:%S'),
            "status": "completed",
            "metrics": metrics
        }
        with open(self.progress_path, "w") as f:
            json.dump(progress, f)
            
    def on_log(self, args, state, control, logs=None, **kwargs):
        if logs is not None:
            # Ghi thông tin log
            current_epoch = int(state.epoch)
            loss = logs.get('loss', 'N/A')
            progress = {
                "current_epoch": current_epoch,
                "total_epochs": self.total_epochs,
                "percent": round((current_epoch / self.total_epochs) * 100, 2),
                "loss": loss,
                "start_time": logs.get('start_time', None),
                "end_time": logs.get('end_time', None),
                "status": "training",
                "metrics": logs
            }
            with open(self.progress_path, "w") as f:
                json.dump(progress, f)

# === 8. Training Arguments ===
model_version = int(time.time())
output_dir = os.path.join(os.path.dirname(__file__), "models", f"model_{model_version}")

# Tạo thư mục models nếu chưa tồn tại
models_dir = os.path.join(os.path.dirname(__file__), "models")
if not os.path.exists(models_dir):
    os.makedirs(models_dir)

# Tạo thư mục model version
os.makedirs(output_dir, exist_ok=True)

# In ra version để service có thể lấy
print(f"MODEL_VERSION:{model_version}", file=sys.stderr)
print(f"MODEL_PATH:{output_dir}", file=sys.stderr)

training_args = TrainingArguments(
    output_dir=output_dir,
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

print("Bắt đầu huấn luyện...", file=sys.stderr)
trainer.train()
print("Huấn luyện hoàn tất.", file=sys.stderr)

# === 11. Lấy kết quả đánh giá cuối cùng ===
final_metrics = trainer.evaluate()

# Thêm version và path vào metrics
final_metrics['MODEL_VERSION'] = str(model_version)
final_metrics['MODEL_PATH'] = output_dir

# In kết quả metrics cuối cùng ra stdout dưới dạng JSON
print(json.dumps(final_metrics))

# === 12. Lưu model & tokenizer ===
try:
    # Đảm bảo thư mục tồn tại
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Lưu model và tokenizer
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    
    # Kiểm tra xem file đã được lưu chưa
    if os.path.exists(os.path.join(output_dir, "config.json")):
        print(f"Mô hình và tokenizer đã lưu thành công tại: {output_dir}", file=sys.stderr)
    else:
        print(f"Lỗi: Không thể lưu model tại {output_dir}", file=sys.stderr)
        
except Exception as e:
    print(f"Lỗi khi lưu model: {str(e)}", file=sys.stderr)
    raise e

print(f"Model version: {model_version}", file=sys.stderr)
print(f"MODEL_VERSION:{model_version}", file=sys.stderr)
print(f"MODEL_PATH:{output_dir}", file=sys.stderr)
