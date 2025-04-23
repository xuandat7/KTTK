import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Product } from 'src/modules/products/entities/products.entity';
import { Attribute } from 'src/modules/products/entities/attributes.entity';

@Entity()
export class Feedback implements IEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  comment: string;

  @Column()
  sentiment: string;

  @Column({ nullable: true })
  modelId: number; // Liên kết phản hồi với mô hình đã phân tích nó

  @CreateDateColumn()
  createdAt: Date; // Lưu thời gian phản hồi được tạo

  @ManyToOne(() => Product, (product) => product.feedbacks, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => Attribute, { nullable: true })
  attribute: Attribute;
}
