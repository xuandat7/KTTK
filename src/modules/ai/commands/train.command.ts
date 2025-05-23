import { MLCommand } from './ml-command.interface';
import { spawn } from 'child_process';
import { join } from 'path';
import { Repository } from 'typeorm';
import { TrainingProgress } from '../../ml/entities/training-progress.entity';
import * as fs from 'fs';
import * as path from 'path';

export class TrainCommand implements MLCommand {
  private options: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    trainSubset?: number;
    datasetPath?: string;
  } = { epochs: 3, batchSize: 16, learningRate: 0.001 };

  constructor(
    private readonly trainingProgressRepository: Repository<TrainingProgress>,
    private readonly trainingProgressId: number,
  ) {}

  setOptions(options: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    trainSubset?: number;
    datasetPath?: string;
  }) {
    this.options = options;
  }

  getOptions() {
    return this.options;
  }

  async execute(): Promise<any> {
    return new Promise((resolve, reject) => {
      const trainScriptPath = path.join(
        process.cwd(),
        'src',
        'modules',
        'ai',
        'train.py',
      );

      const args = [
        '--epochs',
        this.options.epochs.toString(),
        '--batch_size',
        this.options.batchSize.toString(),
        '--learning_rate',
        this.options.learningRate.toString(),
        '--train_subset',
        this.options.trainSubset ? this.options.trainSubset.toString() : '0',
        '--dataset',
        this.options.datasetPath || '',
      ];

      const childProcess = spawn('python', [trainScriptPath, ...args]);

      let finalMetrics = ''; // Biến lưu trữ kết quả cuối cùng từ script Python

      childProcess.stdout.on('data', async (data) => {
        const output = data.toString().trim();
        try {
          const progress = JSON.parse(output); 
          if (progress.eval_f1) {
            finalMetrics = output; // Lưu kết quả metrics cuối cùng dưới dạng chuỗi JSON
          }
          await this.trainingProgressRepository.update(
            this.trainingProgressId,
            {
              current_epoch: progress.epoch || 0,
              percent: (progress.epoch / this.options.epochs) * 100 || 0,
              loss: progress.loss || 'N/A',
            },
          );
        } catch (error) {
          console.log(`Non-JSON output: ${output}`);
        }
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
      let stdoutData = ''; // Biến lưu trữ toàn bộ dữ liệu từ stdout

      childProcess.stdout.on('data', (data) => {
        stdoutData += data.toString(); // Ghép dữ liệu từ các chunk
      });
      childProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const lines = stdoutData.trim().split('\n'); // Tách các dòng
            for (const line of lines) {
              try {
                const parsedOutput = JSON.parse(line); // Parse từng dòng
                if (parsedOutput.eval_f1) {
                  resolve(parsedOutput); // Trả về metrics cuối cùng
                  return;
                }
              } catch (error) {
                console.log(`Non-JSON output: ${line}`);
              }
            }
            reject('No final metrics received from training script.');
          } catch (error) {
            reject('Failed to parse final metrics.');
          }
        } else {
          reject(`Training process exited with code ${code}`);
        }
      });
    });
  }
}
