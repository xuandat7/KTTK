import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { Attribute } from './entities/attributes.entity';

import { EntityFactory } from '../common/factories/entity.factory';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly productFactory: EntityFactory<Product>,
  ) {}

  findAll() {
    return this.productRepository.find({ relations: ['category'] });
  }

  findOne(id: number) {
    return this.productRepository.findOne({ where: { id }, relations: ['category'] });
  }

  async create(data: { name: string; price: number; description: string; attributes: string[]; categoryId: number }) {
    const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });
    if (!category) {
      throw new Error('Category not found');
    }

    // Tạo danh sách thuộc tính
    const attributes = data.attributes.map((attributeName) => {
      const attribute = new Attribute();
      attribute.name = attributeName;
      return attribute;
    });

    // Tạo sản phẩm
    const product = this.productFactory.create({
      ...data,
      category,
      attributes, // Gắn danh sách thuộc tính vào sản phẩm
    });

    return this.productRepository.save(product);
  }

  async update(
    id: number,
    data: { name?: string; price?: number; description?: string; attributes?: string[]; categoryId?: number },
  ) {
    const product = await this.findOne(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (data.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });
      if (!category) {
        throw new Error('Category not found');
      }
      product.category = category;
    }

    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  delete(id: number) {
    return this.productRepository.delete(id);
  }
}