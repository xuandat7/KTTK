import { Injectable } from '@nestjs/common';
import { TrainingProgressService } from './training-progress.service';
import { ModelService } from '../model.service';
import { TrainCommand } from 'src/modules/ai/commands/train.command';
import { MLInvoker } from 'src/modules/ai/commands/ml-invoker';
import { TrainParams } from 'src/modules/ai/commands/ml-command.interface';
import { Repository } from 'typeorm';
import { TrainingProgress } from '../entities/training-progress.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TrainingService {
  constructor(
    private readonly trainingProgressService: TrainingProgressService,
    private readonly modelService: ModelService,
    @InjectRepository(TrainingProgress)
    private readonly trainingProgressRepository: Repository<TrainingProgress>,
  ) {}

  async train(params: TrainParams): Promise<any> {
    const { epochs, batch_size, learning_rate, train_subset, dataset } = params;

    if (!dataset || dataset.trim() === '') {
      throw new Error('Dataset path is required.');
    }

    // 1. Tạo bản ghi TrainingProgress
    const trainingProgress = await this.trainingProgressService.createProgress(epochs);

    // 2. Khởi tạo TrainCommand
    const trainCommand = new TrainCommand(
      this.trainingProgressRepository,
      trainingProgress.id,
    );

    trainCommand.setOptions({
      epochs,
      batchSize: batch_size,
      learningRate: learning_rate,
      trainSubset: train_subset,
      datasetPath: dataset,
    });

    // 3. Thực thi TrainCommand
    const invoker = new MLInvoker();
    try {
      const metrics = await invoker.run(trainCommand);

      // 4. Cập nhật trạng thái hoàn tất
      await this.trainingProgressService.updateProgress(trainingProgress.id, {
        status: 'completed',
        end_time: new Date(),
      });

      // 5. Trả về kết quả huấn luyện (metrics) mà không lưu mô hình
      return { metrics, parameters: params };
    } catch (error) {
      // Cập nhật trạng thái thất bại
      await this.trainingProgressService.updateProgress(trainingProgress.id, {
        status: 'failed',
      });

      throw new Error('Training failed. Please check the logs for more details.');
    }
  }

  
}