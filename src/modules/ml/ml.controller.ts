import { Controller, Get, Post, Query, Param, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse, ApiQuery, ApiConsumes, ApiBody, ApiProperty } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { MLService } from './ml.service';
import { IsNumber, IsOptional, IsString } from 'class-validator';

class TrainModelDto {
  @ApiProperty({ description: 'Số epoch huấn luyện', example: 10 })
  @IsNumber()
  epochs: number;

  @ApiProperty({ description: 'Kích thước batch', example: 32 })
  @IsNumber()
  batch_size: number;

  @ApiProperty({ description: 'Tốc độ học', example: 0.001 })
  @IsNumber()
  learning_rate: number;

  @ApiProperty({ description: 'Số lượng mẫu huấn luyện (tùy chọn)', example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  train_subset?: number;

  @ApiProperty({ description: 'Đường dẫn đến file dataset (tùy chọn)', example: 'path/to/dataset.csv', required: false })
  @IsOptional()
  @IsString()
  dataset?: string;
}

@Controller('ml')
export class MLController {
  constructor(private readonly mlService: MLService) {}

  @Post('train')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        epochs: { type: 'number', description: 'Số epoch huấn luyện' },
        batch_size: { type: 'number', description: 'Kích thước batch' },
        learning_rate: { type: 'number', description: 'Tốc độ học' },
        train_subset: { type: 'number', description: 'Số lượng mẫu huấn luyện (tùy chọn)' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'File dataset tải lên (tùy chọn)',
        },
      },
    },
  })
  async train(
    @UploadedFile() file: Express.Multer.File,
    @Body('epochs') epochs: number,
    @Body('batch_size') batch_size: number,
    @Body('learning_rate') learning_rate: number,
    @Body('train_subset') train_subset?: number,
  ) {
    let datasetPath;

    // Nếu có file dataset được tải lên
    if (file) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'datasets');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Lưu file với tên cố định
      datasetPath = path.join(uploadPath, 'train_product_feedback.csv');
      fs.writeFileSync(datasetPath, file.buffer);
    } else {
      throw new Error('File dataset không được tải lên.');
    }

    const params = { epochs, batch_size, learning_rate, train_subset, datasetPath };
    const logs = await this.mlService.trainModel(params);
    return { logs };
  }

  @Post('upload-dataset')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDataset(@UploadedFile() file: Express.Multer.File): Promise<{ message: string }> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const uploadPath = path.join(process.cwd(), 'uploads', 'datasets');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, file.originalname);
    fs.writeFileSync(filePath, file.buffer);

    return { message: `File uploaded successfully: ${file.originalname}` };
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
