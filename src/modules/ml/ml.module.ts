import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MLService } from './ml.service';
import { MLController } from './ml.controller';
import { TrainingProgress } from './entities/training-progress.entity';
import { Model } from './entities/model.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { MLGateway } from './ml.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Model, Feedback, TrainingProgress]),
  ],
  controllers: [MLController],
  providers: [MLService, MLGateway],
})
export class MLModule {}
