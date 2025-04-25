export interface MLCommand {
    execute(): Promise<any>;
}

export interface TrainParams {
  epochs: number;          // Số epoch huấn luyện
  batch_size: number;      // Kích thước batch
  learning_rate: number;   // Tốc độ học
  train_subset?: number;   // Số lượng mẫu dữ liệu huấn luyện (tùy chọn)
  dataset: string;         // Đường dẫn đến file dataset
}
