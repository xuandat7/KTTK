import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { ApiBody } from '@nestjs/swagger';
import { Product } from '../products/entities/products.entity';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  findAll() {
    return this.feedbackService.findAll();
  }

  @Get('product/:id')
  findByProduct(@Param('id') productId: number) {
    return this.feedbackService.findByProduct(productId);
  }

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        comment: { type: 'string', example: 'Great product' },
        sentiment: { type: 'string', example: 'positive' },
        product: {
          type: 'object',
          properties: { id: { type: 'number', example: 1 } },
        },
      },
    },
  })
  create(
    @Body()
    feedbackData: {
      comment: string;
      sentiment: string;
      product: Product;
    },
  ) {
    return this.feedbackService.create(feedbackData);
  }
}
