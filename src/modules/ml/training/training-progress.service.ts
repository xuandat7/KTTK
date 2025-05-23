import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgress } from '../entities/training-progress.entity';

@Injectable()
export class TrainingProgressService {
  constructor(
    @InjectRepository(TrainingProgress)
    private readonly trainingProgressRepository: Repository<TrainingProgress>,
  ) {}

  async createProgress(totalEpochs: number): Promise<TrainingProgress> {
    const progress = this.trainingProgressRepository.create({
      current_epoch: 0,
      total_epochs: totalEpochs,
      percent: 0,
      status: 'training',
      loss: null,
    });
    return this.trainingProgressRepository.save(progress);
  }

  async updateProgress(id: number, updates: Partial<TrainingProgress>): Promise<void> {
    await this.trainingProgressRepository.update(id, updates);
  }
}