import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get(':productId')
  getStatistics(@Param('productId') productId: number) {
    return this.statisticsService.getStatistics(productId);
  }
}