import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from 'src/modules/products/entities/products.entity';

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  comment: string;

  @Column()
  sentiment: string;

  @ManyToOne(() => Product, (product) => product.feedbacks, { onDelete: 'CASCADE' })
  product: Product;
}
