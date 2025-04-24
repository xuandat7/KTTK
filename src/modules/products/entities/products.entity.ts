import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Feedback } from '../../feedback/entities/feedback.entity';
import { Statistics } from '../../statistics/entities/statistics.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { Attribute } from './attributes.entity';

@Entity()
export class Product implements IEntity{
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

  @OneToMany(() => Statistics, (statistics) => statistics.product, { cascade: true })
  statistics: Statistics[];

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
  category: Category; // Thêm thuộc tính này để thiết lập quan hệ với Category
}
