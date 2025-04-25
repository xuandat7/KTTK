import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './modules/products/products.module';
// import { ModelsModule } from './modules/models/models.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { MLModule } from './modules/ml/ml.module';
import { CategoryModule } from './modules/category/category.module';
import { ModelModule } from './modules/ml/model.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ProductsModule,
    MLModule,
    FeedbackModule,
    StatisticsModule,
    MLModule,
    CategoryModule,
    ModelModule,
  ],
})
export class AppModule {}
