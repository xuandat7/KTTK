import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { MLInvoker } from '../ai/commands/ml-invoker';
import { TrainCommand } from '../ai/commands/train.command';
import { PredictCommand } from '../ai/commands/predict.command';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class MLService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async trainModel(params: { epochs: number; batch_size: number; learning_rate: number; train_subset?: number }): Promise<any> {
    const { epochs, batch_size, learning_rate, train_subset } = params;

    // Chuyển đổi batch_size sang số nguyên
    const parsedParams = {
      epochs,
      batch_size: parseInt(batch_size.toString(), 10), // Đảm bảo batch_size là số nguyên
      learning_rate,
      train_subset: train_subset ? parseInt(train_subset.toString(), 10) : undefined,
    };

    const paramsPath = path.join(process.cwd(), 'src', 'modules', 'ai', 'train_params.json');
    fs.writeFileSync(paramsPath, JSON.stringify(parsedParams, null, 2));

    const trainScriptPath = path.join(process.cwd(), 'src', 'modules', 'ai', 'train.py');
    const pythonProcess = spawn('python', [trainScriptPath]);

    const logs: string[] = [];
    const errorLogs: string[] = [];

    return new Promise((resolve, reject) => {
      pythonProcess.stdout.on('data', (data) => {
        logs.push(data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        errorLogs.push(data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          const progressPath = path.join(process.cwd(), 'src', 'modules', 'ai', 'training_progress.json');
          if (fs.existsSync(progressPath)) {
            const progressData = fs.readFileSync(progressPath, 'utf8');
            resolve(JSON.parse(progressData));
          } else {
            resolve({ message: 'Huấn luyện hoàn thành nhưng không tìm thấy kết quả.' });
          }
        } else {
          reject(new Error(`Train script exited with code ${code}. Errors: ${errorLogs.join('\n')}`));
        }
      });
    });
  }

  async predict(feedbackId: number): Promise<Feedback> {
    const invoker = new MLInvoker();

    // 1. Tìm feedback cần dự đoán
    const feedback = await this.feedbackRepository.findOne({
      where: { id: feedbackId },
      relations: ['product', 'attribute'],
    });
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    // 2. Dự đoán sentiment từ nội dung của feedback
    const sentiment = await invoker.run(new PredictCommand(feedback.comment));

    // 3. Lấy mô hình mới nhất từ DB
    const latestModel = await this.modelRepository.findOne({
      where: {},
      order: { trainedAt: 'DESC' },
    });

    if (!latestModel) {
      throw new Error('No trained model found');
    }

    // 4. Cập nhật sentiment và modelId vào feedback
    feedback.sentiment = sentiment;
    feedback.modelId = latestModel.id;

    // 5. Lưu feedback đã cập nhật
    return this.feedbackRepository.save(feedback);
  }
}
