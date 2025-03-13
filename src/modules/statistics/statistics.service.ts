import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../feedback/entities/feedback.entity';
import { Product } from '../products/entities/products.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getProductStatistics(productId: number) {
    const product = await this.productRepository.findOne({ where: { id: productId }, relations: ['feedbacks'] });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const feedbacks = product.feedbacks;
    const totalFeedbacks = feedbacks.length;
    const positiveFeedbacks = feedbacks.filter(f => f.sentiment === 'positive').length;
    const negativeFeedbacks = feedbacks.filter(f => f.sentiment === 'negative').length;

    return {
      productId,
      totalFeedbacks,
      positiveFeedbacks,
      negativeFeedbacks,
    };
  }
}
