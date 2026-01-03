import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, isAbsolute } from 'node:path';

// Modules
import { PlayersModule } from './modules/players/players.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SignageContentModule } from './modules/signage-content/signage-content.module';
import { SignageModule } from './modules/signage/signage.module';

// Gateway & Services
import { SignageGateway } from './gateways/signage.gateway';
import { SessionMonitorService } from './services/session-monitor.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(
      (() => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        // Parse mssql://username:password@host:port/database?params
        const url = new URL(databaseUrl);
        const encrypt = url.searchParams.get('encrypt') !== 'false';

        return {
          type: 'mssql',
          host: url.hostname,
          port: Number.parseInt(url.port) || 1433,
          username: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
          database: url.pathname.slice(1), // Remove leading /
          options: {
            encrypt,
            trustServerCertificate: !encrypt,
          },
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // Disable in production
          logging: process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug',
        };
      })(),
    ),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: (() => {
        const mediaPath = process.env.MEDIA_PATH;
        if (!mediaPath) {
          throw new Error('MEDIA_PATH environment variable is not configured');
        }
        return isAbsolute(mediaPath) ? mediaPath : join(process.cwd(), mediaPath);
      })(),
      serveRoot: '/media',
    }),
    PlayersModule,
    SessionsModule,
    SignageContentModule,
    SignageModule,
  ],
  controllers: [],
  providers: [SignageGateway, SessionMonitorService],
})
export class AppModule {}
