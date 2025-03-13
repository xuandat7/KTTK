import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('product/:id')
  getProductStatistics(@Param('id') id: number) {
    return this.statisticsService.getProductStatistics(id);
  }
}
