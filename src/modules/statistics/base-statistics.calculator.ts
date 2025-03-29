import { Injectable } from '@nestjs/common';
import { IStatisticsCalculator } from './statistics.interface';
import { Product } from '../products/entities/products.entity';
import { Statistics } from './entities/statistics.entity';
import { EntityFactory } from '../common/factories/entity.factory';

@Injectable()
export class BaseStatisticsCalculator implements IStatisticsCalculator {
  constructor(private readonly factory: EntityFactory<Statistics>) {}

  async calculate(product: Product): Promise<Statistics> {
    const feedbacks = product.feedbacks || [];
    const totalFeedbacks = feedbacks.length;
    const positiveFeedbacks = feedbacks.filter(f => f.sentiment === 'positive').length;
    const negativeFeedbacks = feedbacks.filter(f => f.sentiment === 'negative').length;

    return this.factory.create({
      product,
      totalFeedbacks,
      positiveFeedbacks,
      negativeFeedbacks,
    });
  }
}