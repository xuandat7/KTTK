import { IFactory } from 'src/modules/common/factories/factory.interface';
import { Statistics } from '../entities/statistics.entity';
import { Product } from 'src/modules/products/entities/products.entity';

export class StatisticsFactory implements IFactory<Statistics> {
  create(data: {
    totalFeedbacks: number;
    positiveFeedbacks: number;
    negativeFeedbacks: number;
    product: Product;
  }): Statistics {
    const statistics = new Statistics();
    statistics.totalFeedbacks = data.totalFeedbacks;
    statistics.positiveFeedbacks = data.positiveFeedbacks;
    statistics.negativeFeedbacks = data.negativeFeedbacks;
    statistics.product = data.product;
    return statistics;
  }
}
