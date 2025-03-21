import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { ProductFactory } from './factories/product.factory';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly productFactory: ProductFactory,
  ) {}

  findAll() {
    return this.productRepository.find();
  }

  findOne(id: number) {
    return this.productRepository.findOne({ where: { id } });
  }

  create(data: { name: string; price: number; description: string; attributes: string[] }) {
    const product = this.productFactory.create(data);
    return this.productRepository.save(product);
  }

  delete(id: number) {
    return this.productRepository.delete(id);
  }

  async update(id: number, data: { name?: string; price?: number; description?: string; attributes?: string[] }) {
    await this.productRepository.update(id, data);
    return this.findOne(id);
  }
}