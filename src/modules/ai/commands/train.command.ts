import { MLCommand } from './ml-command.interface';
import { spawn } from 'child_process';
import { join } from 'path';

export class TrainCommand implements MLCommand {
  async execute(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const scriptPath = join(process.cwd(), 'src', 'modules', 'ai', 'train.py');
      const logs: string[] = [];

      const processPython = spawn(
        'python', [scriptPath]
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
