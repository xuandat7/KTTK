import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { MLService } from './ml.service';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TrainParams } from '../ai/commands/ml-command.interface';

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
        train_subset: {
          type: 'number',
          description: 'Số lượng mẫu huấn luyện (tùy chọn)',
        },
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
    @Body() body: TrainParams,
  ) {
    let datasetPath;
    let datasetRecord;

    // Nếu có file dataset được tải lên
    if (file) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'datasets');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Lưu file với tên cố định
      datasetPath = path.join(uploadPath, file.originalname);
      fs.writeFileSync(datasetPath, file.buffer);

      // Lưu thông tin dataset vào cơ sở dữ liệu
      datasetRecord = await this.mlService.saveDataset({
        name: file.originalname,
        type: file.mimetype,
        file_path: datasetPath,
      });
    } else {
      throw new Error('File dataset không được tải lên.');
    }

    // Đảm bảo sử dụng tham số từ request
    const params: TrainParams = {
      ...body,
      dataset: datasetPath,
    };

    const result = await this.mlService.trainModel(params);

    // Lưu tạm thời params và metrics
    this.mlService.cacheTrainingResult(params, result.metrics);

    // Trả về kết quả huấn luyện (metrics) mà không lưu mô hình
    return {
      metrics: result.metrics,
      parameters: params,
      dataset: datasetRecord,
    };
  }

  @Get('train-progress')
  @ApiResponse({ status: 200, description: 'Tiến trình training hiện tại' })
  getTrainProgress() {
    const progressPath = path.join(
      process.cwd(),
      'src',
      'modules',
      'ai',
      'training_progress.json',
    );

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
        loss: progress.loss || 'N/A',
        start_time: progress.start_time || 'N/A',
        end_time: progress.end_time || 'N/A',
        status: progress.status || 'unknown',
        metrics: progress.metrics || {},
      };
    } catch (err) {
      return {
        message: 'Lỗi khi đọc tiến trình training.',
        error: err.message,
      };
    }
  }

  @Get('predict/:feedbackId')
  @ApiResponse({ status: 200, description: 'Dự đoán sentiment cho feedback' })
  @ApiResponse({ status: 404, description: 'Feedback hoặc model không tìm thấy' })
  @ApiResponse({ status: 500, description: 'Lỗi khi dự đoán' })
  @ApiQuery({ name: 'modelId', required: false, type: Number })
  async predict(
    @Param('feedbackId') feedbackId: number,
    @Query('modelId') modelId?: number
  ) {
    try {
      if (!feedbackId) {
        return { error: 'Missing feedbackId' };
      }

      const updatedFeedback = await this.mlService.predict(feedbackId, modelId);
      return { 
        success: true,
        data: updatedFeedback 
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('confirm-save')
  @ApiResponse({
    status: 200,
    description: 'Xác nhận lưu mô hình vào cơ sở dữ liệu',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          description: 'Xác nhận lưu mô hình (true/false)',
        },
      },
    },
  })
  async confirmSaveModel(@Body() body: { confirm?: boolean }): Promise<any> {
    if (!body || typeof body.confirm !== 'boolean') {
      throw new Error('Invalid request body. "confirm" must be a boolean value.');
    }

    if (body.confirm) {
      // Lấy params và metrics từ nơi lưu trữ tạm thời
      const cachedResult = this.mlService.getCachedTrainingResult();

      if (!cachedResult || !cachedResult.params || !cachedResult.metrics) {
        throw new Error('No training result found to save.');
      }

      const { params, metrics } = cachedResult;

      // Gọi hàm saveModel để lưu mô hình vào cơ sở dữ liệu
      return this.mlService.saveModel(params, metrics);
    } else {
      return { message: 'Model save operation was cancelled.' };
    }
  }
}
