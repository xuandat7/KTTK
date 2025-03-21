import { IFactory } from 'src/modules/common/factories/factory.interface';
import { Feedback } from '../entities/feedback.entity';
import { Product } from 'src/modules/products/entities/products.entity';

export class FeedbackFactory implements IFactory<Feedback> {
  create(data: {
    comment: string;
    sentiment: string;
    product: Product;
  }): Feedback {
    const feedback = new Feedback();
    feedback.comment = data.comment;
    feedback.sentiment = data.sentiment;
    feedback.product = data.product;
    return feedback;
  }
}
