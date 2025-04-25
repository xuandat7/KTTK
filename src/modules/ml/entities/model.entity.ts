import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Model implements IEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: 'aspect' | 'sentiment'; // Nhận dạng thuộc tính hoặc phân loại cảm xúc

  @Column()
  version: string;

  @Column()
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
}
