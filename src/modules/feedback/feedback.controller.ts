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
        productId: { type: 'number', example: 1 },
        attributeId: { type: 'number', example: 2 },
      },
    },
  })
  async create(
    @Body()
    feedbackData: {
      comment: string;
      sentiment: string;
      productId: number;
      attributeId: number;
    },
  ) {
    return this.feedbackService.create(feedbackData);
  }
}
