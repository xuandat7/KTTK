import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { MLService } from './ml.service';
import { ApiResponse, ApiQuery } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

@Controller('ml')
export class MLController {
  constructor(private readonly mlService: MLService) {}

  @Post('train')
  @ApiResponse({ status: 200, description: 'Bắt đầu quá trình huấn luyện mô hình' })
  @ApiQuery({ name: 'epochs', required: true, type: Number, description: 'Số epoch huấn luyện' })
  @ApiQuery({ name: 'batch_size', required: true, type: Number, description: 'Kích thước batch' })
  @ApiQuery({ name: 'learning_rate', required: true, type: Number, description: 'Tốc độ học' })
  @ApiQuery({ name: 'train_subset', required: false, type: Number, description: 'Số lượng mẫu huấn luyện (tùy chọn)' })
  async train(
    @Query('epochs') epochs: number,
    @Query('batch_size') batch_size: number,
    @Query('learning_rate') learning_rate: number,
    @Query('train_subset') train_subset?: number,
  ) {
    const params = { epochs, batch_size, learning_rate, train_subset };
    const logs = await this.mlService.trainModel(params);
    return { logs };
  }

  @Get('train-progress')
  @ApiResponse({ status: 200, description: 'Tiến trình training hiện tại' })
  getTrainProgress() {
    const progressPath = path.join(process.cwd(), 'src', 'modules', 'ai', 'training_progress.json');

    try {
      if (!fs.existsSync(progressPath)) {
        return { message: 'Chưa có tiến trình training.' };
      }

      const data = fs.readFileSync(progressPath, 'utf8');
      const progress = JSON.parse(data);

      // Trả về thông tin chi tiết
      return {
        current_epoch: progress.current_epoch || 0,
        total_epochs: progress.total_epochs || 0,
        percent: progress.percent || 0,
        loss: progress.loss || "N/A",
        start_time: progress.start_time || "N/A",
        end_time: progress.end_time || "N/A",
        status: progress.status || "unknown"
      };
    } catch (err) {
      return { message: 'Lỗi khi đọc tiến trình training.', error: err.message };
    }
  }

  @Get('predict/:feedbackId')
  @ApiResponse({ status: 200, description: 'Dự đoán sentiment cho feedback' })
  async predict(@Param('feedbackId') feedbackId: number) {
    if (!feedbackId) return { error: 'Missing feedbackId' };

    const updatedFeedback = await this.mlService.predict(feedbackId);
    return { updatedFeedback };
  }
}
