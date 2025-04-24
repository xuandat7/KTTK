import { Controller, Get, Param, Post } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('product/:id')
  async getProductStatistics(@Param('id') productId: number) {
    return this.statisticsService.getProductStatistics(productId);
  }

  @Post('product/:id/update')
  async updateProductStatistics(@Param('id') productId: number) {
    return this.statisticsService.updateStatistics(productId);
  }
}
