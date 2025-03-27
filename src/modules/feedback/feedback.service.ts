import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Product } from '../products/entities/products.entity';
import { EntityFactory } from '../common/factories/entity.factory';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    private readonly feedbackFactory: EntityFactory<Feedback>,
  ) {}

  findAll() {
    return this.feedbackRepository.find({ relations: ['product'] });
  }

  findByProduct(productId: number) {
    return this.feedbackRepository.find({ where: { product: { id: productId } }, relations: ['product'] });
  }

  create(feedbackData: { comment: string; sentiment: string; product: Product }) {
    const feedback = this.feedbackFactory.create(feedbackData);
    return this.feedbackRepository.save(feedback);
  }
}