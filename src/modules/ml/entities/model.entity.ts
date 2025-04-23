import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

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

  @Column()
  trainedAt: Date;

  @Column({ nullable: true })
  description: string;
}
