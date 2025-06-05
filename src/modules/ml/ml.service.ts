import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { TrainingProgress } from './entities/training-progress.entity';
import { MLInvoker } from '../ai/commands/ml-invoker';
import { TrainCommand } from '../ai/commands/train.command';
import { PredictCommand } from '../ai/commands/predict.command';
import { TrainParams } from '../ai/commands/ml-command.interface';

import { Dataset } from './entities/dataset.entity';
import { TrainingProgressService } from './training/training-progress.service';
import { ModelService } from './model.service';
import { DatasetService } from './dataset.service';
import { TrainingService } from './training/training.service';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class MLService {
  private cachedTrainingResult: { params: any; metrics: any } | null = null;
  private cachedPredictions: Record<number, { sentiment: string, modelId: number }> = {};

  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(TrainingProgress)
    private readonly trainingProgressRepository: Repository<TrainingProgress>,
    @InjectRepository(Dataset)
    private readonly datasetRepository: Repository<Dataset>,

    private readonly trainingProgressService: TrainingProgressService,
    private readonly modelService: ModelService,
    private readonly trainingService: TrainingService,

  ) {}

  async trainModel(params: TrainParams): Promise<any> {
    return this.trainingService.train(params);
  }

  async saveDataset(datasetData: { name: string; type: string; file_path: string }) {
    const dataset = this.datasetRepository.create(datasetData);
    return await this.datasetRepository.save(dataset);
  }

  async predict(feedbackIds: number[], modelId?: number): Promise<{ feedbackId: number; comment: string; predictedSentiment: string; modelId: number | null }[]> {
    const invoker = new MLInvoker();
    const results: { feedbackId: number; comment: string; predictedSentiment: string; modelId: number | null }[] = [];

    for (const feedbackId of feedbackIds) {
      // 1. Tìm feedback cần dự đoán
      const feedback = await this.feedbackRepository.findOne({
        where: { id: feedbackId },
        relations: ['product', 'attribute'],
      });

      if (!feedback) {
        console.warn(`Feedback with ID ${feedbackId} not found, skipping.`);
        continue; // Bỏ qua nếu feedback không tồn tại
      }

      // 2. Lấy model để dự đoán
      let model;
      try {
        if (modelId) {
          model = await this.modelRepository.findOne({ where: { id: modelId } });
          if (!model) { throw new Error(`Model with ID ${modelId} not found`); }
        } else {
          model = await this.modelRepository.findOne({
            where: { isActive: true },
            order: { trainedAt: 'DESC' },
          });
          if (!model) { throw new Error('No active model found'); }
        }

        if (!model.savePath) { throw new Error(`Model ${model.id} has no save path`); }

        // 3. Dự đoán sentiment
        const predictedSentiment = await invoker.run(new PredictCommand(feedback.comment, model.savePath));

        // Lưu kết quả dự đoán tạm thời vào cache
        this.cachedPredictions[feedbackId] = { sentiment: predictedSentiment, modelId: model.id };

        results.push({
          feedbackId: feedback.id,
          comment: feedback.comment,
          predictedSentiment,
          modelId: model.id,
        });

      } catch (error) {
        console.error(`Prediction error for feedback ${feedbackId}:`, error);
        // Thêm kết quả lỗi vào danh sách trả về
        results.push({
          feedbackId: feedback.id,
          comment: feedback.comment,
          predictedSentiment: `Error: ${error.message}`,
          modelId: modelId || null, // Giữ nguyên modelId nếu có
        });
      }
    }

    return results;
  }

  async confirmSelectedPredictions(feedbackIdsToConfirm: number[]): Promise<Feedback[]> {
    const updatedFeedbacks: Feedback[] = [];

    for (const feedbackId of feedbackIdsToConfirm) {
      // Lấy kết quả dự đoán từ cache tạm thời
      const cached = this.cachedPredictions[feedbackId];

      if (!cached) {
        console.warn(`Predicted sentiment for feedback ${feedbackId} not found in cache, skipping.`);
        continue; // Bỏ qua nếu không có trong cache
      }

      const feedback = await this.feedbackRepository.findOne({
        where: { id: feedbackId },
        relations: ['product', 'attribute'],
      });

      if (!feedback) {
        console.warn(`Feedback with ID ${feedbackId} not found in DB, skipping.`);
        // Xóa khỏi cache nếu không tồn tại trong DB nữa
        delete this.cachedPredictions[feedbackId];
        continue;
      }

      // Cập nhật feedback với sentiment và modelId từ cache
      feedback.sentiment = cached.sentiment;
      feedback.modelId = cached.modelId;

      // Lưu vào cơ sở dữ liệu
      const savedFeedback = await this.feedbackRepository.save(feedback);
      updatedFeedbacks.push(savedFeedback);

      // Xóa khỏi cache sau khi xác nhận
      delete this.cachedPredictions[feedbackId];
    }

    return updatedFeedbacks;
  }

  async saveModel(params: any, metrics: any): Promise<any> {
    // Lấy model version và path từ output của train.py
    let modelVersion = '';
    let modelPath = '';

    // Lấy version và path từ metrics (output JSON của train.py)
    if (metrics && typeof metrics === 'object') {
      if (metrics['MODEL_VERSION']) {
        modelVersion = metrics['MODEL_VERSION'];
      }
      if (metrics['MODEL_PATH']) {
        modelPath = metrics['MODEL_PATH'];
      }
    }

    // Nếu không có version hoặc path thì báo lỗi
    if (!modelVersion || !modelPath) {
      throw new Error('Không lấy được version hoặc path từ output của train.py!');
    }

    // Chuyển path tuyệt đối thành path tương đối (nếu cần)
    let relativePath = modelPath;
    if (modelPath.startsWith(process.cwd())) {
      relativePath = modelPath.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, '');
    }

    // Kiểm tra thư mục model tồn tại trước khi lưu vào DB
    const absolutePath = require('path').join(process.cwd(), relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error('Model folder does not exist, training may have failed!');
    }

    console.log('Saving model with version:', modelVersion);
    console.log('Absolute model path:', absolutePath);
    console.log('Relative model path:', relativePath);

    // Lưu thông tin mô hình vào cơ sở dữ liệu
    return this.modelService.saveModel({
      name: `Model_${modelVersion}`,
      type: 'sentiment',
      version: modelVersion,
      trainedAt: new Date(),
      metrics,
      parameters: params,
      savePath: relativePath, // Lưu path tương đối
      isActive: false // Mặc định là không active
    });
  }

  cacheTrainingResult(params: any, metrics: any): void {
    this.cachedTrainingResult = { params, metrics };
  }

  getCachedTrainingResult(): { params: any; metrics: any } | null {
    return this.cachedTrainingResult;
  }
}
