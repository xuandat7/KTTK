import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/products.entity';
import { Attribute } from './entities/attributes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Attribute])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}