import { Module } from '@nestjs/common';
import { MLService } from './ml.service';
import { MLController } from './ml.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from './entities/model.entity';
import { Feedback } from '../feedback/entities/feedback.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Model, Feedback])], // Add your entities here
  providers: [MLService],
  controllers: [MLController],
})
export class MLModule {}
