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
        const lines = data.toString().split('\n').filter(line => line.trim());
        logs.push(...lines);
        console.log("[Train Output]", lines); // 🐞 log ra console NestJS
      });

      processPython.stderr.on('data', (data) => {
        console.error('❌ Python error (train):', data.toString());
      });

      processPython.on('close', (code) => {
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
      let errorOutput = '';

      processPython.stdout.on('data', (data) => {
        output += data.toString();
      });

      processPython.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('❌ Python error (predict):', data.toString());
      });

      processPython.on('close', (code) => {
        if (output.trim()) {
          console.log('📤 Predict output:', output.trim()); // ✅ hiển thị đầu ra rõ ràng
          resolve(output.trim());
        } else {
          console.warn('⚠️ Không có kết quả trả về từ predict.py');
          resolve(errorOutput.trim() || 'Không có output');
        }
      });
    });
  }
}
