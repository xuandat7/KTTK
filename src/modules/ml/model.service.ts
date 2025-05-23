import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { TrainParams } from '../ai/commands/ml-command.interface';

@Injectable()
export class ModelService {
  async saveModel(data: Partial<Model>): Promise<Model> {
    const model = this.modelRepository.create(data);
    return this.modelRepository.save(model);
  }
  
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
  ) {}

  // Lấy tất cả models
  async getAllModels(): Promise<Model[]> {
    return this.modelRepository.find(); // Trả về tất cả các model từ database
  }

  // Lấy model theo ID
  async getModelById(id: number): Promise<Model> {
    const model = await this.modelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    return model;
  }

  // Xóa model theo ID
  async deleteModel(id: number): Promise<void> {
    const result = await this.modelRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Model not found');
    }
  }

  // Kích hoạt model theo ID
  async activateModel(id: number): Promise<void> {
    const model = await this.getModelById(id); // Kiểm tra xem model có tồn tại không
    model.isActive = true; // Giả định rằng model có thuộc tính `isActive`
    await this.modelRepository.save(model); // Lưu thay đổi vào database
  }

  // bỏ kích hoạt model theo ID
  async deactivateModel(id: number): Promise<void> {
    const model = await this.getModelById(id); // Kiểm tra xem model có tồn tại không
    model.isActive = false; // Giả định rằng model có thuộc tính `isActive`
    await this.modelRepository.save(model); // Lưu thay đổi vào database
  }


  
  
}