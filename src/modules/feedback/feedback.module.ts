import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { EntityFactory } from '../common/factories/entity.factory';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback]), CommonModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [],
})
export class FeedbackModule {}