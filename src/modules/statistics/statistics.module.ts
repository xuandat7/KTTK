import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Feedback } from '../feedback/entities/feedback.entity';
import { Product } from '../products/entities/products.entity';
import { Statistics } from './entities/statistics.entity';
import { StatisticsFactory } from './factories/statistics.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Product, Statistics])],
  controllers: [StatisticsController],
  providers: [StatisticsService, StatisticsFactory],
  exports: [StatisticsFactory],
})
export class StatisticsModule {}
