import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiBody } from '@nestjs/swagger';

@Controller('Products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Laptop XYZ' },
        price: { type: 'number', example: 1200 },
        description: { type: 'string', example: 'A high-end gaming laptop' },
        attributes: { type: 'array', items: { type: 'string' }, example: ['RAM 16GB', 'SSD 512GB'] },
      },
    },
  })
  create(@Body() data: { name: string; price: number; description: string; attributes: string[] }) {
    return this.productsService.create(data);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.productsService.delete(id);
  }

  @Put(':id')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Laptop' },
        price: { type: 'number', example: 1300 },
        description: { type: 'string', example: 'An updated high-end gaming laptop' },
        attributes: { type: 'array', items: { type: 'string' }, example: ['Updated RAM 32GB', 'Updated SSD 1TB'] },
      },
    },
  })
  update(@Param('id') id: number, @Body() data: { name?: string; price?: number; description?: string; attributes?: string[] }) {
    return this.productsService.update(id, data);
  }
}