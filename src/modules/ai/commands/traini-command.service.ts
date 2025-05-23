import { Injectable } from '@nestjs/common';
import { MLInvoker } from '../../ai/commands/ml-invoker';
import { TrainCommand } from '../../ai/commands/train.command';
import { TrainParams } from '../../ai/commands/ml-command.interface';
import { TrainingProgressService } from 'src/modules/ml/training/training-progress.service';

@Injectable()
export class TrainCommandService {
  constructor(
    private readonly trainingProgressService: TrainingProgressService,
  ) {}

  async executeTrainCommand(params: TrainParams, trainingProgressId: number): Promise<any> {
    const trainCommand = new TrainCommand(
      this.trainingProgressService['trainingProgressRepository'], // Inject repository
      trainingProgressId,
    );

    trainCommand.setOptions({
      epochs: params.epochs,
      batchSize: params.batch_size,
      learningRate: params.learning_rate,
      trainSubset: params.train_subset,
      datasetPath: params.dataset,
    });

    const invoker = new MLInvoker();
    return invoker.run(trainCommand);
  }
}