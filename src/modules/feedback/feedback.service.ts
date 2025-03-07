import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Product } from '../products/entities/products.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  findAll() {
    return this.feedbackRepository.find({ relations: ['product'] });
  }

  findByProduct(productId: number) {
    return this.feedbackRepository.find({ where: { product: { id: productId } }, relations: ['product'] });
  }

  create(feedbackData: { comment: string; sentiment: string; product: Product }) {
    const feedback = this.feedbackRepository.create({
      comment: feedbackData.comment,
      sentiment: feedbackData.sentiment,
      product: feedbackData.product,
    });
    return this.feedbackRepository.save(feedback);
  }
}