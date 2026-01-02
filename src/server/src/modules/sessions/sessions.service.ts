import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../../entities';
import { CreateSessionDto, UpdateSessionDto } from '@shared/types';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async findAll(): Promise<SessionEntity[]> {
    return this.sessionRepository.find({
      relations: ['player'],
      order: { startDate: 'DESC', startTime: 'ASC' },
    });
  }

  async findOne(id: number): Promise<SessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['player'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  /**
   * Finds the currently active session based on current day and time
   * One-time sessions override recurring sessions
   */
  async findActiveSession(): Promise<SessionEntity | null> {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
    const currentTime = this.formatTime(now);

    // Get all active sessions
    const allSessions = await this.sessionRepository.find({
      where: { isActive: true },
      relations: ['player'],
    });

    let activeOneTimeSession: SessionEntity | null = null;
    let activeRecurringSession: SessionEntity | null = null;

    for (const session of allSessions) {
      const endTime = this.calculateEndTime(session.startTime, session.duration);

      if (session.isRecurring) {
        // Check recurring session: match day of week and time
        if (
          session.dayOfWeek === currentDay &&
          this.isTimeInRange(currentTime, session.startTime, endTime)
        ) {
          activeRecurringSession = session;
        }
      } else {
        // Check one-time session: match date and time
        const sessionDate = new Date(session.startDate);
        const isSameDate = this.isSameDate(now, sessionDate);
        if (isSameDate && this.isTimeInRange(currentTime, session.startTime, endTime)) {
          activeOneTimeSession = session;
          break; // One-time sessions have priority, so we can break early
        }
      }
    }

    // One-time sessions override recurring sessions
    return activeOneTimeSession || activeRecurringSession;
  }

  /**
   * Finds the previous session that has ended
   */
  async findPreviousSession(currentTime: Date = new Date()): Promise<SessionEntity | null> {
    const currentDay = currentTime.getDay();
    const timeStr = this.formatTime(currentTime);
    const allSessions = await this.sessionRepository.find({
      where: { isActive: true },
      relations: ['player'],
    });

    let previousSession: SessionEntity | null = null;
    let latestEndDateTime: Date | null = null;

    for (const session of allSessions) {
      const endTime = this.calculateEndTime(session.startTime, session.duration);
      const sessionDate = new Date(session.startDate);

      if (session.isRecurring) {
        // For recurring: check if same day but earlier
        if (session.dayOfWeek === currentDay && endTime < timeStr) {
          const sessionEndDateTime = this.combineDateAndTime(currentTime, endTime);
          if (!latestEndDateTime || sessionEndDateTime > latestEndDateTime) {
            previousSession = session;
            latestEndDateTime = sessionEndDateTime;
          }
        }
      } else {
        // For one-time: check if date has passed
        const sessionEndDateTime = this.combineDateAndTime(sessionDate, endTime);

        if (sessionEndDateTime < currentTime) {
          if (!latestEndDateTime || sessionEndDateTime > latestEndDateTime) {
            previousSession = session;
            latestEndDateTime = sessionEndDateTime;
          }
        }
      }
    }

    return previousSession;
  }

  /**
   * Finds the next upcoming session
   */
  async findNextSession(currentTime: Date = new Date()): Promise<SessionEntity | null> {
    const currentDay = currentTime.getDay();
    const timeStr = this.formatTime(currentTime);
    const allSessions = await this.sessionRepository.find({
      where: { isActive: true },
      relations: ['player'],
    });

    let nextSession: SessionEntity | null = null;
    let earliestStartDateTime: Date | null = null;

    for (const session of allSessions) {
      const sessionDate = new Date(session.startDate);

      if (session.isRecurring) {
        // For recurring: check if same day but later, or upcoming days
        if (sessionDate <= currentTime) {
          // Only consider recurring sessions that have started
          const sessionStartDateTime = this.getNextRecurringDateTime(
            session,
            currentDay,
            timeStr,
            currentTime,
          );

          if (
            sessionStartDateTime &&
            (!earliestStartDateTime || sessionStartDateTime < earliestStartDateTime)
          ) {
            nextSession = session;
            earliestStartDateTime = sessionStartDateTime;
          }
        }
      } else {
        // For one-time: check if date is in the future
        const sessionStartDateTime = this.combineDateAndTime(sessionDate, session.startTime);

        if (sessionStartDateTime > currentTime) {
          if (!earliestStartDateTime || sessionStartDateTime < earliestStartDateTime) {
            nextSession = session;
            earliestStartDateTime = sessionStartDateTime;
          }
        }
      }
    }

    return nextSession;
  }

  /**
   * Helper to calculate next occurrence of recurring session
   */
  private getNextRecurringDateTime(
    session: SessionEntity,
    currentDay: number,
    currentTime: string,
    currentDate: Date,
  ): Date | null {
    if (session.dayOfWeek === undefined) {
      return null;
    }

    // Same day but later
    if (session.dayOfWeek === currentDay && session.startTime > currentTime) {
      return this.combineDateAndTime(currentDate, session.startTime);
    }

    // Future day this week
    if (session.dayOfWeek > currentDay) {
      const daysUntil = session.dayOfWeek - currentDay;
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + daysUntil);
      return this.combineDateAndTime(futureDate, session.startTime);
    }

    return null;
  }

  /**
   * Finds all sessions within a specified time window (in minutes) from the given time
   */
  async findSessionsNearTime(
    currentTime: Date = new Date(),
    windowMinutes: number = 30,
  ): Promise<SessionEntity[]> {
    const currentDay = currentTime.getDay();
    const allSessions = await this.sessionRepository.find({
      where: { isActive: true },
      relations: ['player'],
    });

    const nearbySessions: SessionEntity[] = [];

    // Calculate window boundaries
    const windowStart = new Date(currentTime.getTime() - windowMinutes * 60 * 1000);
    const windowEnd = new Date(currentTime.getTime() + windowMinutes * 60 * 1000);

    for (const session of allSessions) {
      const sessionDate = new Date(session.startDate);
      let sessionStartDateTime: Date;

      if (session.isRecurring) {
        // For recurring sessions, check if it matches today
        if (session.dayOfWeek === currentDay && sessionDate <= currentTime) {
          sessionStartDateTime = this.combineDateAndTime(currentTime, session.startTime);
        } else {
          continue;
        }
      } else {
        // For one-time sessions, use the session date
        sessionStartDateTime = this.combineDateAndTime(sessionDate, session.startTime);
      }

      // Calculate session end time
      const sessionEndDateTime = new Date(
        sessionStartDateTime.getTime() + session.duration * 60 * 1000,
      );

      // Check if session overlaps with window: sessionStart <= windowEnd AND windowStart <= sessionEnd
      if (sessionStartDateTime <= windowEnd && windowStart <= sessionEndDateTime) {
        nearbySessions.push(session);
      }
    }

    return nearbySessions;
  }

  async create(createSessionDto: CreateSessionDto): Promise<SessionEntity> {
    const session = this.sessionRepository.create(createSessionDto);
    return this.sessionRepository.save(session);
  }

  async update(id: number, updateSessionDto: UpdateSessionDto): Promise<SessionEntity> {
    const session = await this.findOne(id);
    Object.assign(session, updateSessionDto);
    return this.sessionRepository.save(session);
  }

  async remove(id: number): Promise<void> {
    const session = await this.findOne(id);
    await this.sessionRepository.remove(session);
  }

  /**
   * Helper method to format Date object to HH:MM string
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper method to calculate end time from start time and duration
   */
  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  /**
   * Helper method to check if current time is within start and end time range
   */
  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Helper method to check if two dates are the same day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Helper method to combine date and time string into a Date object
   */
  private combineDateAndTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }
}
