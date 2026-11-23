import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

const DEFAULT_PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  // A value read from .env is a string; listen() accepts both.
  const port = app
    .get(ConfigService)
    .get<string | number>('PORT', DEFAULT_PORT);
  await app.listen(port);
  Logger.log(`API ready at http://localhost:${port}/tasks`, 'Bootstrap');
}
await bootstrap();
