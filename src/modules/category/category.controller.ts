import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Tạo category mới', type: Category })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Electronics' },
      },
      required: ['name'],
    },
  })
  create(@Body() body: { name: string }) {
    return this.categoryService.create(body.name);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Lấy danh sách category', type: [Category] })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Lấy chi tiết category', type: Category })
  findOne(@Param('id') id: number) {
    return this.categoryService.findOne(id);
  }
}
