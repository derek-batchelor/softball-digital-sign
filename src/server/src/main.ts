import { NestFactory } from '@nestjs/core';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function bootstrap() {
  const logLevelEnv = getRequiredEnv('LOG_LEVEL');
  const validLogLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  const levelIndex = validLogLevels.indexOf(logLevelEnv as LogLevel);
  if (levelIndex < 0) {
    throw new Error(`Invalid LOG_LEVEL value: ${logLevelEnv}`);
  }
  const logger: LogLevel[] = validLogLevels.slice(0, levelIndex + 1);

  const app = await NestFactory.create(AppModule, { logger });

  const corsOriginEnv = getRequiredEnv('CORS_ORIGIN');
  const corsOrigin =
    corsOriginEnv === '*' ? '*' : corsOriginEnv.split(',').map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  const portEnv = getRequiredEnv('PORT');
  const port = Number(portEnv);
  if (Number.isNaN(port)) {
    throw new TypeError(`PORT must be a number, received: ${portEnv}`);
  }

  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
