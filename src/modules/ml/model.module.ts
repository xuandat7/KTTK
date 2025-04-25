import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';
import { Model } from './entities/model.entity';

@
Module({
  imports: [TypeOrmModule.forFeature([Model])],
  controllers: [ModelController],
  providers: [ModelService],
})
export class ModelModule {}