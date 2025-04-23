import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  create(name: string) {
    const category = new Category();
    category.name = name;
    return this.categoryRepository.save(category);
  }

  findAll() {
    return this.categoryRepository.find({ relations: ['products'] });
  }

  findOne(id: number) {
    return this.categoryRepository.findOne({ where: { id }, relations: ['products'] });
  }
}
