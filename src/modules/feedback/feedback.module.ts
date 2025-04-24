import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { EntityFactory } from '../common/factories/entity.factory';
import { CommonModule } from '../common/common.module';
import { Attribute } from '../products/entities/attributes.entity';
import { Statistics } from '../statistics/entities/statistics.entity';
import { StatisticsService } from '../statistics/statistics.service';
import { Product } from '../products/entities/products.entity';
import { ProductsModule } from '../products/products.module';
import { BaseStatisticsCalculator } from '../statistics/base-statistics.calculator';
import { StatisticsModule } from '../statistics/statistics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, Attribute, Statistics, Product]),
    CommonModule,
    ProductsModule,
    StatisticsModule
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, StatisticsService, BaseStatisticsCalculator],
  exports: [],
})
export class FeedbackModule {}
