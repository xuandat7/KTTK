import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('training_progress')
export class TrainingProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  current_epoch: number;

  @Column({ type: 'int' })
  total_epochs: number;

  @Column({ type: 'float' })
  percent: number;

  @Column({ type: 'float', nullable: true })
  loss: number | null;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;
}