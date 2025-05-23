import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dataset } from './entities/dataset.entity';

@Injectable()
export class DatasetService {
  constructor(
    @InjectRepository(Dataset)
    private readonly datasetRepository: Repository<Dataset>,
  ) {}

  async saveDataset(data: { name: string; type: string; file_path: string }): Promise<Dataset> {
    const dataset = this.datasetRepository.create(data);
    return this.datasetRepository.save(dataset);
  }
}