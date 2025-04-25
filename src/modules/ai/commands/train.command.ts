import { MLCommand } from './ml-command.interface';
import { spawn } from 'child_process';
import { join } from 'path';
import { Repository } from 'typeorm';
import { TrainingProgress } from '../../ml/entities/training-progress.entity';

export class TrainCommand implements MLCommand {
    private options: { epochs?: number; batchSize?: number } = {};

    constructor(
        private readonly trainingProgressRepository: Repository<TrainingProgress>,
        private readonly trainingProgressId: number
    ) {}

    setOptions(options: { epochs?: number; batchSize?: number }) {
        this.options = options;
    }

    getOptions() {
        return this.options;
    }

    async execute(): Promise<string[]> {
        const { epochs, batchSize } = this.options;
        return new Promise((resolve, reject) => {
            const scriptPath = join(process.cwd(), 'src', 'modules', 'ai', 'train.py');
            const logs: string[] = [];

            const processPython = spawn(
                'python', 
                [
                    scriptPath, 
                    '--epochs', (epochs || 3).toString(), // Giá trị mặc định là 3
                    '--batch_size', (batchSize || 16).toString() // Giá trị mặc định là 16
                ]
            );

            processPython.stdout.on('data', async (data) => {
                logs.push(...data.toString().split('\n').filter(line => line.trim()));

                // Update progress based on logs (example: epoch completion)
                const progressMatch = data.toString().match(/Epoch (\d+)\/\d+/);
                if (progressMatch) {
                    const currentEpoch = parseInt(progressMatch[1], 10);
                    const percent = (currentEpoch / (epochs || 3)) * 100;
                    await this.trainingProgressRepository.update(this.trainingProgressId, {
                        current_epoch: currentEpoch,
                        percent,
                    });
                }
            });

            processPython.stderr.on('data', (data) => {
                console.error('[Train Error]', data.toString());
            });

            processPython.on('close', async (code) => {
                if (code === 0) {
                    await this.trainingProgressRepository.update(this.trainingProgressId, {
                        status: 'completed',
                        end_time: new Date(),
                    });
                    resolve(logs);
                } else {
                    await this.trainingProgressRepository.update(this.trainingProgressId, {
                        status: 'failed',
                    });
                    reject(new Error(`Train script exited with code ${code}`));
                }
            });
        });
    }
}
