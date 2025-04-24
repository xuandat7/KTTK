import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/products.entity';
import { Attribute } from './entities/attributes.entity';
import { CommonModule } from '../common/common.module';
import { Category } from '../category/entities/category.entity';
import { Statistics } from '../statistics/entities/statistics.entity';
import { StatisticsService } from '../statistics/statistics.service';
import { BaseStatisticsCalculator } from '../statistics/base-statistics.calculator';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Attribute, Category, Statistics]), CommonModule],
  controllers: [ProductsController],
  providers: [ProductsService, StatisticsService, BaseStatisticsCalculator],
  exports: [],
})
export class ProductsModule {}