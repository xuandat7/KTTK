import { Controller, Get, Param } from '@nestjs/common';
import { MLService } from './ml.service';

@Controller('ml')
export class MLController {
  constructor(private readonly mlService: MLService) {}

  @Get('train')
  async train() {
    const logs = await this.mlService.trainModel();
    return { logs };
  }

  @Get('predict/:feedbackId')
  async predict(@Param('feedbackId') feedbackId: number) {
    if (!feedbackId) return { error: 'Missing feedbackId' };

    const updatedFeedback = await this.mlService.predict(feedbackId);
    return { updatedFeedback };
  }
}
