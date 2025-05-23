import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TrainingProgress } from './training-progress.entity';

@Entity('dataset')
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  file_path: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => TrainingProgress, (trainingProgress) => trainingProgress.dataset)
  trainingProgresses: TrainingProgress[];
}