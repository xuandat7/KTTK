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
    @InjectRepository(Statistics)
    private readonly statisticsRepo: Repository<Statistics>,
    private readonly baseCalculator: BaseStatisticsCalculator,
  ) {}

  async getProductStatistics(productId: number): Promise<Statistics> {
    // Kiểm tra xem số liệu thống kê đã tồn tại chưa
    let statistics = await this.statisticsRepo.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });

    if (!statistics) {
      // Nếu chưa tồn tại, tính toán và lưu số liệu thống kê
      const product = await this.productRepo.findOne({
        where: { id: productId },
        relations: ['feedbacks'],
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      statistics = await this.baseCalculator.calculate(product);
      statistics = await this.statisticsRepo.save(statistics);
    }

    return statistics;
  }

  async updateStatistics(productId: number): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['feedbacks'],
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const updatedStatistics = await this.baseCalculator.calculate(product);

    let statistics = await this.statisticsRepo.findOne({
      where: { product: { id: productId } },
    });

    if (statistics) {
      statistics.totalFeedbacks = updatedStatistics.totalFeedbacks;
      statistics.positiveFeedbacks = updatedStatistics.positiveFeedbacks;
      statistics.negativeFeedbacks = updatedStatistics.negativeFeedbacks;
    } else {
      statistics = this.statisticsRepo.create({
        ...updatedStatistics,
        product,
      });
    }

    await this.statisticsRepo.save(statistics);
  }
}