import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../feedback/entities/feedback.entity';
import { Product } from '../products/entities/products.entity';
import { Statistics } from './entities/statistics.entity';
import { EntityFactory } from '../common/factories/entity.factory';
import { BaseStatisticsCalculator } from './base-statistics.calculator';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly baseCalculator: BaseStatisticsCalculator,
  ) {}

  async getProductStatistics(productId: number): Promise<Statistics> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['feedbacks'],
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    return this.baseCalculator.calculate(product);
  }
}