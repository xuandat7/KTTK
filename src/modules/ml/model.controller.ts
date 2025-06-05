import { Controller, Get, Param, Delete, Post, UseGuards } from '@nestjs/common';
import { ModelService } from './model.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Models')
// @ApiBearerAuth() // Thêm Bearer Auth cho Swagger
@Controller('models')
// @UseGuards(JwtAuthGuard) // Áp dụng Guard cho toàn bộ controller
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  async getAllModels() {
    return this.modelService.getAllModels();
  }

  @Get(':id')
  async getModelById(@Param('id') id: number) {
    return this.modelService.getModelById(id);
  }

  @Delete(':id')
  async deleteModel(@Param('id') id: number) {
    await this.modelService.deleteModel(id);
    return { message: 'Model deleted successfully' };
  }

  @Post(':id/activate')
  async activateModel(@Param('id') id: number) {
    await this.modelService.activateModel(id);
    return { message: 'Model activated successfully' };
  }

  @Post(':id/deactivate')
  async deactivateModel(@Param('id') id: number) {
    await this.modelService.deactivateModel(id);
    return { message: 'Model deactivated successfully' };
  }
  
}