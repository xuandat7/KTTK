import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('Server is running on http://localhost:3000');
  app.enableCors(); 

  const config = new DocumentBuilder()
    .setTitle('Feedback Analysis API')
    .setDescription('API for managing products, feedback, and AI models')
    .setVersion('1.0')

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(3000);
}
bootstrap();
