import os
import pandas as pd
import torch
import numpy as np
os.environ["TRANSFORMERS_NO_TF"] = "1"

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.utils.class_weight import compute_class_weight
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)

# === 1. Load & chuẩn bị dữ liệu ===
DATA_PATH = "src/modules/ai/data"
df_train = pd.read_csv(os.path.join(DATA_PATH, "train_product_feedback.csv"))
df_val = pd.read_csv(os.path.join(DATA_PATH, "validation_product_feedback.csv"))
df_test = pd.read_csv(os.path.join(DATA_PATH, "test_product_feedback.csv"))

df = pd.concat([df_train, df_val, df_test]).dropna().reset_index(drop=True)
df = df[["comment", "label"]]
# ⚠️ Dùng subset để demo (giảm từ 5k–10k → 1000 dòng)
df = df.sample(50, random_state=42).reset_index(drop=True)

train_df, val_df = train_test_split(df, test_size=0.2, stratify=df["label"], random_state=42)
train_ds = Dataset.from_pandas(train_df)
val_ds = Dataset.from_pandas(val_df)

# === 2. Tokenizer PhoBERT ===
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base", use_fast=False)

def preprocess(batch):
    return tokenizer(batch["comment"], truncation=True, padding='max_length', max_length=256)

train_ds = train_ds.map(preprocess, batched=True).rename_column("label", "labels")
val_ds = val_ds.map(preprocess, batched=True).rename_column("label", "labels")

train_ds.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])
val_ds.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])

# === 3. Tính trọng số class (weighted loss) ===
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_df["label"]),
    y=train_df["label"]
)
weights = torch.tensor(class_weights, dtype=torch.float)

# === 4. Khởi tạo model PhoBERT ===
model = AutoModelForSequenceClassification.from_pretrained("vinai/phobert-base", num_labels=3)

# === 5. Custom Trainer dùng weighted loss ===
class WeightedTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.get("labels")
        outputs = model(**inputs)
        logits = outputs.get("logits")
        loss_fn = torch.nn.CrossEntropyLoss(weight=weights.to(model.device))
        loss = loss_fn(logits, labels)
        return (loss, outputs) if return_outputs else loss

# === 6. Training Arguments ===
training_args = TrainingArguments(
    output_dir="./phobert-weighted",
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_strategy="epoch",
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    num_train_epochs=3,
    learning_rate=2e-5,
    save_total_limit=1,
    load_best_model_at_end=True,
    metric_for_best_model="eval_f1",
    logging_dir="./logs",
    report_to="none"
)

# === 7. Metric đánh giá ===
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = torch.argmax(torch.tensor(logits), dim=-1).numpy()
    report = classification_report(labels, preds, output_dict=True)
    return {
        "accuracy": report["accuracy"],
        "f1": report["weighted avg"]["f1-score"],
        "precision": report["weighted avg"]["precision"],
        "recall": report["weighted avg"]["recall"]
    }

# === 8. Huấn luyện mô hình ===
trainer = WeightedTrainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=val_ds,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

trainer.train()

# === 9. Lưu model & tokenizer chuẩn chỉnh ===
SAVE_DIR = "phobert-weighted"
model.save_pretrained(SAVE_DIR)
tokenizer.save_pretrained(SAVE_DIR)
print(f"sentiment:{os.path.abspath(SAVE_DIR)}")


print(f"✅ Mô hình và tokenizer đã lưu tại: {SAVE_DIR}")
