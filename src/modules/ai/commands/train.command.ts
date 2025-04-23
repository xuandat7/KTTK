import { MLCommand } from './ml-command.interface';
import { spawn } from 'child_process';
import { join } from 'path';

export class TrainCommand implements MLCommand {
    getCommandArgs(): import("child_process").SpawnOptionsWithoutStdio | undefined {
      throw new Error('Method not implemented.');
    }
    private options: { epochs?: number; batchSize?: number } = {};

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

            processPython.stdout.on('data', (data) => {
                logs.push(...data.toString().split('\n').filter(line => line.trim()));
            });

            processPython.stderr.on('data', (data) => {
                console.error('[Train Error]', data.toString());
            });

            processPython.on('close', () => {
                resolve(logs);
            });
        });
    }
}
