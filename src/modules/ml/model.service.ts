import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';

@Injectable()
export class ModelService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
  ) {}

  async getAllModels(): Promise<Model[]> {
    return this.modelRepository.find();
  }

  async getModelById(id: number): Promise<Model> {
    const model = await this.modelRepository.findOne({ where: { id } });
    if (!model) {
      throw new Error(`Model with ID ${id} not found`);
    }
    return model;
  }

  async deleteModel(id: number): Promise<void> {
    const model = await this.getModelById(id);
    if (model && model.savePath) {
      // Xóa file mô hình nếu tồn tại
      const fs = require('fs');
      if (fs.existsSync(model.savePath)) {
        fs.unlinkSync(model.savePath);
      }
    }
    await this.modelRepository.delete(id);
  }

  async activateModel(id: number): Promise<void> {
    // Hủy kích hoạt tất cả các mô hình khác
    await this.modelRepository.update({}, { isActive: false });

    // Kích hoạt mô hình được chọn
    await this.modelRepository.update(id, { isActive: true });
  }
}