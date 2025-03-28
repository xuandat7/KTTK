import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';

@Injectable()
export class MLService {
  async trainModel(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const scriptPath = join(process.cwd(), 'src', 'modules', 'ai', 'train.py');
      const processPython = spawn(
        'C:\\Users\\pc\\.virtualenvs\\Hot-Food-AY896jf4\\Scripts\\python.exe',
        [scriptPath]
      );

      const logs: string[] = [];

      processPython.stdout.on('data', (data) => {
        logs.push(...data.toString().split('\n').filter(line => line.trim()));
      });

      processPython.stderr.on('data', (data) => {
        console.error('❌ Python error (train):', data.toString());
      });

      processPython.on('close', () => {
        resolve(logs);
      });
    });
  }

  async predict(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = join(process.cwd(), 'src', 'modules', 'ai', 'predict.py');
      const processPython = spawn(
        'C:\\Users\\pc\\.virtualenvs\\Hot-Food-AY896jf4\\Scripts\\python.exe',
        [scriptPath, text]
      );

      let output = '';

      processPython.stdout.on('data', (data) => {
        output += data.toString();
      });

      processPython.stderr.on('data', (data) => {
        console.error('❌ Python error (predict):', data.toString());
      });

      processPython.on('close', () => {
        resolve(output.trim());
      });
    });
  }
}
