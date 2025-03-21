import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/products.entity';
import { Attribute } from './entities/attributes.entity';
import { ProductFactory } from './factories/product.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Attribute])],
  controllers: [ProductsController],
  providers: [ProductsService, ProductFactory],
  exports: [ProductFactory],
})
export class ProductsModule {}