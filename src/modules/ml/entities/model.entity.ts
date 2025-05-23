import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Model {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: 'aspect' | 'sentiment'; // Nhận dạng thuộc tính hoặc phân loại cảm xúc

  @Column()
  version: string;

  @Column({ type: 'timestamp' })
  trainedAt: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metrics: Record<string, any>; // Lưu trữ hiệu suất của mô hình (accuracy, F1-score, v.v.)

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>; // Lưu trữ các tham số huấn luyện (epochs, batch_size, learning_rate, v.v.)

  @Column({ nullable: true })
  savePath: string; // Đường dẫn lưu trữ mô hình

  @Column({ default: false })
  isActive: boolean; // Trạng thái kích hoạt của mô hình

  // @Column({ type: 'json', nullable: true })
  // trainingConfig: {
  //   epochs: number;
  //   batchSize: number;
  //   learningRate: number;
  //   trainSubset?: number;
  // };

  // @Column({ type: 'json', nullable: true })
  // evaluationMetrics: {
  //   f1: number;
  //   precision: number;
  //   recall: number;
  //   accuracy: number;
  // };

  // @Column({ default: false })
  // isBestModel: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
