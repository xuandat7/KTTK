import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Feedback } from '../../feedback/entities/feedback.entity';
import { Statistics } from '../../statistics/entities/statistics.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { Attribute } from './attributes.entity';

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

  @OneToMany(() => Attribute, (attribute) => attribute.product, { cascade: true })
  attributes: Attribute[];

  @OneToMany(() => Feedback, (feedback) => feedback.product, { cascade: true })
  feedbacks: Feedback[];

  @OneToOne(() => Statistics, { cascade: true }) // Thay đổi từ OneToMany thành OneToOne
  @JoinColumn() // Thêm JoinColumn để thiết lập quan hệ 1-1
  statistics: Statistics;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
  category: Category;
}
