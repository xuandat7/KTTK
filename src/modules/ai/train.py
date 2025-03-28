import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
import joblib
from transformers import AutoTokenizer

# Đường dẫn dữ liệu
data_path = "src/modules/ai/data"
df_train = pd.read_csv(os.path.join(data_path, "train.csv"))
df_valid = pd.read_csv(os.path.join(data_path, "validation.csv"))
df_test = pd.read_csv(os.path.join(data_path, "test.csv"))

df = pd.concat([df_train, df_valid, df_test])
df = df.dropna().reset_index(drop=True)

# Load tokenizer từ HuggingFace
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")

# Encode văn bản từ cột 'comment'
def encode_text(text):
    tokens = tokenizer.encode(text, truncation=True, padding='max_length', max_length=256)
    return tokens

X = np.array([encode_text(s) for s in df["comment"]])
y = df["label"].values

# Chuẩn hóa dữ liệu
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Chia dữ liệu train/val
X_train, X_val, y_train, y_val = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# Train mô hình
clf = LogisticRegression(max_iter=2000)
clf.fit(X_train.tolist(), y_train)

# Đánh giá
y_pred = clf.predict(X_val.tolist())
print(classification_report(y_val, y_pred))

# Lưu mô hình và scaler
joblib.dump(clf, "src/modules/ai/model.pkl")
joblib.dump(scaler, "src/modules/ai/scaler.pkl")
print("Mô hình đã được huấn luyện và lưu tại src/modules/ai/")
