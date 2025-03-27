import { Module } from '@nestjs/common';
import { EntityFactory } from './factories/entity.factory';

@Module({
  providers: [EntityFactory],   // Đăng ký EntityFactory làm provider
  exports: [EntityFactory],     // Export để các module khác có thể sử dụng
})
export class CommonModule {}
