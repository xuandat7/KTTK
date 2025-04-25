import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { TrainingProgress } from './entities/training-progress.entity';
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
    @InjectRepository(TrainingProgress)
    private readonly trainingProgressRepository: Repository<TrainingProgress>,
  ) {}

  async trainModel(params: {
    epochs: number;
    batch_size: number;
    learning_rate: number;
    train_subset?: number;
    dataset?: string;
  }): Promise<any> {
    const { epochs, batch_size, learning_rate, train_subset, dataset } = params;

    // Create a new TrainingProgress entry
    const trainingProgress = this.trainingProgressRepository.create({
      current_epoch: 0,
      total_epochs: epochs,
      percent: 0,
      status: 'training',
      loss: null,
    });
    await this.trainingProgressRepository.save(trainingProgress);

    const parsedParams = {
      epochs,
      batch_size: parseInt(batch_size.toString(), 10),
      learning_rate,
      train_subset: train_subset
        ? parseInt(train_subset.toString(), 10)
        : undefined,
      dataset,
    };

    const paramsPath = path.join(
      process.cwd(),
      'src',
      'modules',
      'ai',
      'train_params.json',
    );
    fs.writeFileSync(paramsPath, JSON.stringify(parsedParams, null, 2));

    const trainScriptPath = path.join(
      process.cwd(),
      'src',
      'modules',
      'ai',
      'train.py',
    );
    const pythonProcess = spawn('python', [trainScriptPath]);

    const logs: string[] = [];
    const errorLogs: string[] = [];

    return new Promise((resolve, reject) => {
      pythonProcess.stdout.on('data', (data) => {
        logs.push(data.toString());
        // Update progress based on logs (example: epoch completion)
        const progressMatch = data.toString().match(/Epoch (\d+)\/\d+/);
        if (progressMatch) {
          const currentEpoch = parseInt(progressMatch[1], 10);
          const percent = (currentEpoch / epochs) * 100;
          this.trainingProgressRepository.update(trainingProgress.id, {
            current_epoch: currentEpoch,
            percent,
          });
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        errorLogs.push(data.toString());
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          this.trainingProgressRepository.update(trainingProgress.id, {
            status: 'completed',
            end_time: new Date(),
          });

          // Lưu thông tin mô hình sau khi huấn luyện hoàn tất
          const model = this.modelRepository.create({
            name: `Model_${new Date().toISOString()}`,
            type: 'sentiment',
            version: '1.0',
            trainedAt: new Date(),
            metrics: { accuracy: 0.95 }, // Ví dụ: giá trị hiệu suất
            parameters: { epochs, batch_size, learning_rate, train_subset },
          });
          await this.modelRepository.save(model);

          resolve({ logs });
        } else {
          this.trainingProgressRepository.update(trainingProgress.id, {
            status: 'failed',
          });
          reject(
            new Error(
              `Train script exited with code ${code}. Errors: ${errorLogs.join('\n')}`,
            ),
          );
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
