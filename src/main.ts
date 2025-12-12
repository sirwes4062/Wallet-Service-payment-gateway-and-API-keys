import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppConfig } from './config/app.config';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // this is to capture raw body for webhook verification
    rawBody: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const configService = app.get(ConfigService);
  const config = configService.get<AppConfig>('app');

  // CORS Configuration
  app.enableCors({
    origin: config?.corsOrigins ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  });

  // 🔥 SWAGGER CONFIG
  const swaggerconfig = new DocumentBuilder()
    .setTitle('Wallet API')
    .setDescription('API documentation for Wallet + API Key + Auth System')
    .setVersion('1.0')
    .addBearerAuth()
    //this allows swagger to accept x-api-key header for endpoints that require it
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' })
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerconfig);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 API Documentation is available at: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
