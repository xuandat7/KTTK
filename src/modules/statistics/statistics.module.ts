import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Feedback } from '../feedback/entities/feedback.entity';
import { Product } from '../products/entities/products.entity';
import { Statistics } from './entities/statistics.entity';
import { CommonModule } from '../common/common.module';
import { BaseStatisticsCalculator } from './base-statistics.calculator';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Product, Statistics]), CommonModule],
  controllers: [StatisticsController],
  providers: [StatisticsService, BaseStatisticsCalculator],
  exports: [StatisticsService],
})
export class StatisticsModule {}
