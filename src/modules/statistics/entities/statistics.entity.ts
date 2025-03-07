import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from 'src/modules/products/entities/products.entity';

@Entity()
export class Statistics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  totalFeedbacks: number;

  @Column()
  positiveFeedbacks: number;

  @Column()
  negativeFeedbacks: number;

  @ManyToOne(() => Product, (product) => product.statistics)
  product: Product;
}