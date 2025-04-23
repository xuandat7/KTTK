import { MLCommand } from './ml-command.interface';
import { spawn } from 'child_process';
import { join } from 'path';

export class PredictCommand implements MLCommand {
  constructor(private text: string) {}

  async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = join(process.cwd(), 'src', 'modules', 'ai', 'predict.py');
      let output = '';
      let errorOutput = '';

      const processPython = spawn(
        'python', [scriptPath, this.text]
      );

      processPython.stdout.on('data', (data) => {
        output += data.toString();
      });

      processPython.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      processPython.on('close', () => {
        if (output.trim()) resolve(output.trim());
        else resolve(errorOutput.trim() || 'Không có output');
      });
    });
  }
}
