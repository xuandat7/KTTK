import { Controller, Get, Param, Delete, Post, Res } from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('models')
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

  @Get(':id/download')
  async downloadModel(@Param('id') id: number, @Res() res) {
    const model = await this.modelService.getModelById(id);
    if (!model || !model.savePath) {
      throw new Error('Model not found or savePath is missing');
    }

    res.download(model.savePath);
  }
}