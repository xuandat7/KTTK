import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { MLInvoker } from '../ai/commands/ml-invoker';
import { TrainCommand } from '../ai/commands/train.command';
import { PredictCommand } from '../ai/commands/predict.command';

@Injectable()
export class MLService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async trainModel(): Promise<string[]> {
    const invoker = new MLInvoker();
    const logs = await invoker.run(new TrainCommand());

    // Lưu thông tin model vào DB sau khi train
    const newModel = this.modelRepository.create({
      name: 'phobert-weighted',
      type: 'sentiment', // hoặc 'aspect' nếu là mô hình thuộc tính
      version: new Date().toISOString(), // ví dụ dùng timestamp làm version
      trainedAt: new Date(),
      description: logs.find(line => line.includes('✅')) || 'Đã train mô hình',
    });

    await this.modelRepository.save(newModel);
    return logs;
  }

  async predict(feedbackId: number): Promise<Feedback> {
    const invoker = new MLInvoker();

    // 1. Tìm feedback cần dự đoán
    const feedback = await this.feedbackRepository.findOne({
      where: { id: feedbackId },
      relations: ['product', 'attribute'],
    });
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    // 2. Dự đoán sentiment từ nội dung của feedback
    const sentiment = await invoker.run(new PredictCommand(feedback.comment));

    // 3. Lấy mô hình mới nhất từ DB
    const latestModel = await this.modelRepository.findOne({
      where: {},
      order: { trainedAt: 'DESC' },
    });

    if (!latestModel) {
      throw new Error('No trained model found');
    }

    // 4. Cập nhật sentiment và modelId vào feedback
    feedback.sentiment = sentiment;
    feedback.modelId = latestModel.id;

    // 5. Lưu feedback đã cập nhật
    return this.feedbackRepository.save(feedback);
  }
}
