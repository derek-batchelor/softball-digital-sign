import { NestFactory } from '@nestjs/core';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Configure logger based on LOG_LEVEL environment variable
  const logLevel = process.env.LOG_LEVEL || 'log';
  const validLogLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  const logger: LogLevel[] = validLogLevels.slice(
    0,
    validLogLevels.indexOf(logLevel as LogLevel) + 1,
  );

  const app = await NestFactory.create(AppModule, { logger });

  // Enable CORS
  const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const corsOrigin =
    corsOriginEnv === '*' ? '*' : corsOriginEnv.split(',').map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
