import { Controller, Get, Query } from '@nestjs/common';
import { MLService } from './ml.service';

@Controller('ml')
export class MLController {
  constructor(private readonly mlService: MLService) {}

  @Get('train')
  async train() {
    const logs = await this.mlService.trainModel();
    return { logs };
  }

  @Get('predict')
  async predict(@Query('text') text: string) {
    if (!text) return { error: 'Missing text input' };
    const result = await this.mlService.predict(text);
    return { result };
  }
}
