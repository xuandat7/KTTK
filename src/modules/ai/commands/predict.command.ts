import { MLCommand } from './ml-command.interface';
import { spawn } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';

export class PredictCommand implements MLCommand {
  constructor(
    private text: string,
    private modelPath: string
  ) {}

  async execute(): Promise<string> {
    try {
      // Chuyển path tương đối thành path tuyệt đối
      const absoluteModelPath = join(process.cwd(), this.modelPath);
      console.log('Model path:', this.modelPath);
      console.log('Absolute model path:', absoluteModelPath);

      // Kiểm tra thư mục model có tồn tại không
      if (!fs.existsSync(absoluteModelPath)) {
        throw new Error(`Thư mục mô hình không tồn tại: ${absoluteModelPath}`);
      }

      // Kiểm tra các file cần thiết
      const requiredFiles = [
        'config.json',
        // Chấp nhận 1 trong 2 file trọng số
        ['pytorch_model.bin', 'model.safetensors'],
        // Các file của tokenizer khi use_fast=False
        'tokenizer_config.json',
        'vocab.txt',
        'bpe.codes'
      ];

      for (const file of requiredFiles) {
        if (Array.isArray(file)) {
          // Chỉ cần 1 trong 2 file tồn tại
          const found = file.some(f => fs.existsSync(join(absoluteModelPath, f)));
          if (!found) {
            throw new Error('Không tìm thấy file trọng số mô hình (pytorch_model.bin hoặc model.safetensors) trong thư mục model');
          }
        } else {
          const filePath = join(absoluteModelPath, file);
          if (!fs.existsSync(filePath)) {
            throw new Error(`File ${file} không tồn tại trong thư mục model`);
          }
        }
      }

      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
          join(process.cwd(), 'src', 'modules', 'ai', 'predict.py'),
          '--text', this.text,
          '--model_path', absoluteModelPath
        ]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error('Python stderr:', data.toString());
        });

        pythonProcess.on('close', (code) => {
          if (code === 0 && output.trim()) {
            resolve(output.trim());
          } else {
            reject(new Error(errorOutput.trim() || 'Prediction failed'));
          }
        });
      });
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }
}
