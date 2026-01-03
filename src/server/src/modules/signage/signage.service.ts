import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions/sessions.service';
import { PlayersService } from '../players/players.service';
import { SignageContentService } from '../signage-content/signage-content.service';
import { ActiveSignageData, ContentType } from '@shared/types';
import { SessionEntity, PlayerEntity } from '../../entities';

// Duration constants (in seconds)
const PLAYER_STATS_DURATION = 30;
const IMAGE_CONTENT_DURATION = 30;
const VIDEO_CONTENT_DURATION = -1; // Client-side detection

@Injectable()
export class SignageService {
  private readonly usedRandomPlayerIds: Set<number> = new Set();
  private lastResetTime: Date = new Date();

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly playersService: PlayersService,
    private readonly signageContentService: SignageContentService,
  ) {}

  async getActiveSignageData(): Promise<ActiveSignageData> {
    const now = new Date();

    // Find sessions within 30 minutes before or after current time
    let currentSession = await this.sessionsService.findActiveSession();
    const sessionsNearby = await this.sessionsService.findSessionsNearTime(now, 30);

    // Determine previous and next from nearby sessions
    let previousSession: SessionEntity | null = null;
    let nextSession: SessionEntity | null = null;

    for (const session of sessionsNearby) {
      const sessionStart = this.parseSessionDateTime(session, now);
      const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);

      // Skip current session (already found)
      if (currentSession && session.id === currentSession.id) {
        continue;
      }

      // Previous: session has ended before now
      if (sessionEnd < now) {
        if (!previousSession) {
          previousSession = session;
        } else {
          const prevEnd = new Date(
            this.parseSessionDateTime(previousSession, now).getTime() +
              previousSession.duration * 60000,
          );
          // Keep the one that ended most recently
          if (sessionEnd > prevEnd) {
            previousSession = session;
          }
        }
      }
      // Next: session starts after now
      else if (sessionStart > now) {
        if (!nextSession) {
          nextSession = session;
        } else {
          const nextStart = this.parseSessionDateTime(nextSession, now);
          // Keep the one that starts soonest
          if (sessionStart < nextStart) {
            nextSession = session;
          }
        }
      }
    }

    // Get players for sessions
    const activePlayers = await this.playersService.findAll();
    const activePlayersFiltered = activePlayers.filter((p) => p.isActive);

    let currentPlayer = currentSession?.playerId
      ? await this.playersService.findOne(currentSession.playerId)
      : null;

    let previousPlayer = previousSession?.playerId
      ? await this.playersService.findOne(previousSession.playerId)
      : null;

    let nextPlayer = nextSession?.playerId
      ? await this.playersService.findOne(nextSession.playerId)
      : null;

    // Build unified content array (handles weekend warrior and random player priority)
    const unifiedContent = await this.buildUnifiedContent(
      currentPlayer,
      previousPlayer,
      nextPlayer,
      activePlayersFiltered,
    );

    // Get fallback content: active signage content + all active players
    const fallbackContent = await this.getFallbackContent();

    return {
      currentSession,
      previousSession,
      nextSession,
      currentPlayer,
      previousPlayer,
      nextPlayer,
      content: unifiedContent,
      fallbackContent,
    };
  }

  private parseSessionDateTime(session: SessionEntity, referenceDate: Date): Date {
    const sessionDate = new Date(session.startDate);
    const [hours, minutes] = session.startTime.split(':').map(Number);
    const dateTime = new Date(referenceDate);
    dateTime.setHours(hours, minutes, 0, 0);

    if (session.isRecurring) {
      // For recurring sessions, use reference date
      return dateTime;
    } else {
      // For one-time sessions, use the actual session date
      return new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate(),
        hours,
        minutes,
        0,
      );
    }
  }

  private getRandomPlayer(
    players: PlayerEntity[],
    exclude: (PlayerEntity | null)[],
  ): PlayerEntity | null {
    // Reset used players if all have been shown or if it's been more than 1 hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (this.usedRandomPlayerIds.size >= players.length || this.lastResetTime < hourAgo) {
      this.usedRandomPlayerIds.clear();
      this.lastResetTime = new Date();
    }

    const excludeSet = new Set(
      exclude.filter((p): p is PlayerEntity => p !== null).map((p) => p.id),
    );

    // Exclude both the explicit excludes and already used random players
    const available = players.filter(
      (p) => !excludeSet.has(p.id) && !this.usedRandomPlayerIds.has(p.id),
    );

    if (available.length === 0) {
      // If no unused players available, pick from unused ones only (ignoring excludes)
      const unusedPlayers = players.filter((p) => !this.usedRandomPlayerIds.has(p.id));
      if (unusedPlayers.length > 0) {
        const selected = unusedPlayers[Math.floor(Math.random() * unusedPlayers.length)];
        this.usedRandomPlayerIds.add(selected.id);
        return selected;
      }
      // Last resort: reset and pick any
      this.usedRandomPlayerIds.clear();
      return players.length > 0 ? players[Math.floor(Math.random() * players.length)] : null;
    }

    const selected = available[Math.floor(Math.random() * available.length)];
    this.usedRandomPlayerIds.add(selected.id);
    return selected;
  }

  async getFallbackContent() {
    const activeContent = await this.signageContentService.findActive();
    const activePlayers = await this.playersService.findAll();

    // Filter to only active players
    const activePlayersOnly = activePlayers.filter((player) => player.isActive);

    // Create virtual signage content for each active player
    const playerContent = activePlayersOnly.map((player) => ({
      id: -player.id, // Negative ID to distinguish from real content
      title: `${player.firstName} ${player.lastName}`,
      contentType: ContentType.PLAYER_STATS,
      duration: PLAYER_STATS_DURATION,
      filePath: player.photoPath,
      playerId: player.id,
      isActive: true,
      order: 0,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      player,
    }));

    // Add duration to media content based on content type
    const mediaContentWithDuration = activeContent.map((item) => ({
      ...item,
      duration:
        item.contentType === ContentType.VIDEO ? VIDEO_CONTENT_DURATION : IMAGE_CONTENT_DURATION,
    }));

    // Combine active signage content with active player content
    return [...mediaContentWithDuration, ...playerContent];
  }

  private async buildUnifiedContent(
    currentPlayer: PlayerEntity | null,
    previousPlayer: PlayerEntity | null,
    nextPlayer: PlayerEntity | null,
    activePlayers: PlayerEntity[],
  ) {
    const content: any[] = [];
    const usedPlayerIds = new Set<number>();
    let orderIndex = 0;

    // 1. Add current player (order: 0) - session player only
    if (currentPlayer) {
      content.push({
        id: -1000 - currentPlayer.id,
        title: `${currentPlayer.firstName} ${currentPlayer.lastName}`,
        contentType: ContentType.PLAYER_STATS,
        duration: PLAYER_STATS_DURATION,
        filePath: currentPlayer.photoPath,
        playerId: currentPlayer.id,
        isActive: true,
        order: orderIndex++,
        createdAt: currentPlayer.createdAt,
        updatedAt: currentPlayer.updatedAt,
        player: currentPlayer,
      });
      usedPlayerIds.add(currentPlayer.id);
    }

    // 2. Add next player (order: 1) - session player only
    if (nextPlayer) {
      content.push({
        id: -2000 - nextPlayer.id,
        title: `${nextPlayer.firstName} ${nextPlayer.lastName}`,
        contentType: ContentType.PLAYER_STATS,
        duration: PLAYER_STATS_DURATION,
        filePath: nextPlayer.photoPath,
        playerId: nextPlayer.id,
        isActive: true,
        order: orderIndex++,
        createdAt: nextPlayer.createdAt,
        updatedAt: nextPlayer.updatedAt,
        player: nextPlayer,
      });
      usedPlayerIds.add(nextPlayer.id);
    }

    // 3. Add previous player (order: 2) - session player only
    if (previousPlayer) {
      content.push({
        id: -3000 - previousPlayer.id,
        title: `${previousPlayer.firstName} ${previousPlayer.lastName}`,
        contentType: ContentType.PLAYER_STATS,
        duration: PLAYER_STATS_DURATION,
        filePath: previousPlayer.photoPath,
        playerId: previousPlayer.id,
        isActive: true,
        order: orderIndex++,
        createdAt: previousPlayer.createdAt,
        updatedAt: previousPlayer.updatedAt,
        player: previousPlayer,
      });
      usedPlayerIds.add(previousPlayer.id);
    }

    // 4. Add weekend warrior if not already in rotation (higher priority than random)
    const weekendWarrior = activePlayers.find(
      (p) => p.isWeekendWarrior && !usedPlayerIds.has(p.id),
    );
    if (weekendWarrior) {
      content.push({
        id: -4000 - weekendWarrior.id,
        title: `${weekendWarrior.firstName} ${weekendWarrior.lastName}`,
        contentType: ContentType.PLAYER_STATS,
        duration: PLAYER_STATS_DURATION,
        filePath: weekendWarrior.photoPath,
        playerId: weekendWarrior.id,
        isActive: true,
        order: orderIndex++,
        createdAt: weekendWarrior.createdAt,
        updatedAt: weekendWarrior.updatedAt,
        player: weekendWarrior,
      });
      usedPlayerIds.add(weekendWarrior.id);
    }

    // 5. Fill with random players to ensure at least 3 players total (non-repeating)
    const minPlayerCount = 3;
    while (content.length < minPlayerCount && usedPlayerIds.size < activePlayers.length) {
      // Filter out already used players
      const availablePlayers = activePlayers.filter((p) => !usedPlayerIds.has(p.id));
      const randomPlayer = this.getRandomPlayer(availablePlayers, []);
      if (!randomPlayer || usedPlayerIds.has(randomPlayer.id)) break;

      content.push({
        id: -5000 - randomPlayer.id - content.length,
        title: `${randomPlayer.firstName} ${randomPlayer.lastName}`,
        contentType: ContentType.PLAYER_STATS,
        duration: PLAYER_STATS_DURATION,
        filePath: randomPlayer.photoPath,
        playerId: randomPlayer.id,
        isActive: true,
        order: orderIndex++,
        createdAt: randomPlayer.createdAt,
        updatedAt: randomPlayer.updatedAt,
        player: randomPlayer,
      });
      usedPlayerIds.add(randomPlayer.id);
    }

    // 6. Add media content (images and videos) with proper durations
    const activeMediaContent = await this.signageContentService.findActive();
    const mediaContent = activeMediaContent.map((item, index) => {
      // Set duration based on content type
      const duration =
        item.contentType === ContentType.VIDEO ? VIDEO_CONTENT_DURATION : IMAGE_CONTENT_DURATION;

      return {
        ...item,
        duration,
        order: orderIndex + (item.order ?? index),
      };
    });

    const finalContent = [...content, ...mediaContent].sort((a, b) => a.order - b.order);

    console.log('🎯 Unified Content Built:', {
      playerCount: content.length,
      mediaCount: mediaContent.length,
      totalCount: finalContent.length,
      players: content.map((c) => `${c.title} (order: ${c.order})`),
      media: mediaContent.map((m) => `${m.title} (order: ${m.order})`),
    });

    return finalContent;
  }
}
