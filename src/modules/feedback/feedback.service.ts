import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Product } from '../products/entities/products.entity';
import { Attribute } from '../products/entities/attributes.entity';
import { EntityFactory } from '../common/factories/entity.factory';
import { Statistics } from '../statistics/entities/statistics.entity';
import { StatisticsService } from '../statistics/statistics.service';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    private readonly feedbackFactory: EntityFactory<Feedback>,
    // @InjectRepository(Statistics)
    private readonly statisticsService: StatisticsService,
  ) {}

  findAll() {
    return this.feedbackRepository.find({
      relations: ['product', 'attribute'],
    });
  }

  findByProduct(productId: number) {
    return this.feedbackRepository.find({
      where: { product: { id: productId } },
      relations: ['product', 'attribute'],
    });
  }

  async create(feedbackData: {
    comment: string;
    sentiment: string;
    productId: number;
    attributeId: number;
  }) {
    // Tìm thuộc tính (attribute)
    const attribute = await this.attributeRepository.findOne({
      where: { id: feedbackData.attributeId },
      relations: ['product'],
    });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    // Tạo feedback
    const feedback = this.feedbackFactory.create({
      comment: feedbackData.comment,
      sentiment: feedbackData.sentiment,
      product: { id: feedbackData.productId } as Product,
      attribute,
    });

    const savedFeedback = await this.feedbackRepository.save(feedback);
    await this.statisticsService.updateStatistics(feedbackData.productId);

    // Chỉ giữ lại attribute.name trong phản hồi
    return {
      ...savedFeedback,
      attribute: { name: attribute.name },
    };
  }

  async delete(feedbackId: number) {
    const feedback = await this.feedbackRepository.findOne({ where: { id: feedbackId } });
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    await this.feedbackRepository.remove(feedback);

    // Cập nhật số liệu thống kê
    await this.statisticsService.updateStatistics(feedback.product.id);
  }
}
