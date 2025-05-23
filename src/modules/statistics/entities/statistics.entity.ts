import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
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

  @OneToOne(() => Product, (product) => product.statistics, { onDelete: 'CASCADE' })
  @JoinColumn() // Thêm JoinColumn để thiết lập quan hệ 1-1
  product: Product;
}
