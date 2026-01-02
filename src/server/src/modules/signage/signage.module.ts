import { Module } from '@nestjs/common';
import { SignageController } from './signage.controller';
import { SignageService } from './signage.service';
import { SessionsModule } from '../sessions/sessions.module';
import { PlayersModule } from '../players/players.module';
import { SignageContentModule } from '../signage-content/signage-content.module';

@Module({
  imports: [SessionsModule, PlayersModule, SignageContentModule],
  controllers: [SignageController],
  providers: [SignageService],
  exports: [SignageService],
})
export class SignageModule {}
