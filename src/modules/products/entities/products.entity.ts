import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Attribute } from './attributes.entity';
import { Feedback } from '../../feedback/entities/feedback.entity';
import { Statistics } from '../../statistics/entities/statistics.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  description: string;

  @Column('text', { array: true, nullable: false, default: '{}' })
  attributes: string[];

  @OneToMany(() => Feedback, (feedback) => feedback.product)
  feedbacks: Feedback[];

  @OneToMany(() => Statistics, (statistics) => statistics.product)
  statistics: Statistics[];
}
