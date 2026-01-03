import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionsService } from '../modules/sessions/sessions.service';
import { SignageGateway } from '../gateways/signage.gateway';
import { SessionChangeEvent } from '@shared/types';

@Injectable()
export class SessionMonitorService {
  private readonly logger = new Logger(SessionMonitorService.name);
  private currentSessionId: number | null = null;

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly signageGateway: SignageGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkSessionTransitions() {
    this.logger.debug('Checking for session transitions...');

    const activeSession = await this.sessionsService.findActiveSession();
    const newSessionId = activeSession?.id ?? null;

    // Session started
    if (newSessionId && newSessionId !== this.currentSessionId && activeSession) {
      this.logger.log(
        `Session started: Player ${activeSession.player?.firstName} ${activeSession.player?.lastName} (ID: ${newSessionId})`,
      );

      const event: SessionChangeEvent = {
        type: 'SESSION_START',
        session: activeSession,
        timestamp: new Date(),
      };

      this.signageGateway.emitSessionChange(event);
      this.currentSessionId = newSessionId;
    }
    // Session ended
    else if (!newSessionId && this.currentSessionId) {
      this.logger.log(`Session ended (ID: ${this.currentSessionId})`);

      const event: SessionChangeEvent = {
        type: 'SESSION_END',
        session: null,
        timestamp: new Date(),
      };

      this.signageGateway.emitSessionChange(event);
      this.currentSessionId = null;
    }
  }
}
