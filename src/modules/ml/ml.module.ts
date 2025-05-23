import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MLService } from './ml.service';
import { MLController } from './ml.controller';
import { TrainingProgress } from './entities/training-progress.entity';
import { Model } from './entities/model.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { MLGateway } from './ml.gateway';
import { Dataset } from './entities/dataset.entity';
import { TrainingProgressService } from './training/training-progress.service';
import { ModelService } from './model.service';
import { DatasetService } from './dataset.service';
import { TrainingService } from './training/training.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Model, Feedback, TrainingProgress, Dataset]),
  ],
  controllers: [MLController],
  providers: [MLService, MLGateway, TrainingProgressService, ModelService, DatasetService, TrainingService  ],
})
export class MLModule {}
