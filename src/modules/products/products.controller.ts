import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ApiProperty } from '@nestjs/swagger';

// DTO để định nghĩa cấu trúc dữ liệu và example
class CreateProductDto {
  @ApiProperty({ example: 'Product A', description: 'Tên sản phẩm' })
  name: string;

  @ApiProperty({ example: 100, description: 'Giá sản phẩm' })
  price: number;

  @ApiProperty({ example: 'Description of Product A', description: 'Mô tả sản phẩm' })
  description: string;

  @ApiProperty({
    example: ['Attribute 1', 'Attribute 2'],
    description: 'Danh sách thuộc tính của sản phẩm',
    type: [String],
  })
  attributes: string[];

  @ApiProperty({ example: 1, description: 'ID của danh mục sản phẩm' })
  categoryId: number;
}

@ApiTags('Products') // Gắn thẻ cho nhóm API
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number, description: 'ID của sản phẩm' })
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBody({ type: CreateProductDto })
  create(@Body() data: CreateProductDto) {
    return this.productsService.create(data);
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: Number, description: 'ID của sản phẩm cần cập nhật' })
  @ApiBody({ type: CreateProductDto })
  update(@Param('id') id: number, @Body() data: CreateProductDto) {
    return this.productsService.update(id, data);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, description: 'ID của sản phẩm cần xóa' })
  delete(@Param('id') id: number) {
    return this.productsService.delete(id);
  }
}