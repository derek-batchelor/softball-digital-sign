export enum ContentType {
  PLAYER_STATS = 'PLAYER_STATS',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  teamName?: string;
  jerseyNumber?: string;
  photoPath?: string;
  graduationYear?: number;
  isActive: boolean;
  isWeekendWarrior: boolean;
  statsStartDate?: Date;
  statsEndDate?: Date;
  // Stats fields
  gamesPlayed: number;
  plateAppearances: number;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbis: number;
  runs: number;
  walks: number;
  strikeouts: number;
  strikeoutsLooking: number;
  hitByPitch: number;
  sacrificeHits: number;
  sacrificeFlies: number;
  reachedOnError: number;
  fieldersChoice: number;
  stolenBases: number;
  caughtStealing: number;
  // Calculated stats
  battingAverage?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  onBasePlusSlugging?: number;
  stolenBasePercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: number;
  isRecurring: boolean; // true for weekly recurring, false for one-time
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for recurring sessions
  startDate: Date; // Required for all sessions
  startTime: string; // Time in HH:MM format (e.g., "18:00")
  duration: number; // Duration in minutes (30, 45, or 60)
  playerId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  player?: Player;
}

export interface SignageContent {
  id: number;
  title: string;
  contentType: ContentType;
  duration: number; // calculated dynamically based on contentType (not stored in DB)
  filePath?: string;
  playerId?: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  player?: Player;
}

export interface ActiveSignageData {
  currentSession: Session | null;
  previousSession: Session | null;
  nextSession: Session | null;
  currentPlayer: Player | null;
  previousPlayer: Player | null;
  nextPlayer: Player | null;
  content: SignageContent[]; // Unified rotation array: players then media, server-ordered
  fallbackContent: SignageContent[]; // Used when no active content
}

export interface SessionChangeEvent {
  type: 'SESSION_START' | 'SESSION_END';
  session: Session | null;
  timestamp: Date;
}

export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  teamName?: string;
  jerseyNumber?: string;
  photoPath?: string;
  graduationYear?: number;
  isActive?: boolean;
  isWeekendWarrior?: boolean;
  statsStartDate?: Date;
  statsEndDate?: Date;
  gamesPlayed?: number;
  plateAppearances?: number;
  atBats?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbis?: number;
  runs?: number;
  walks?: number;
  strikeouts?: number;
  strikeoutsLooking?: number;
  hitByPitch?: number;
  sacrificeHits?: number;
  sacrificeFlies?: number;
  reachedOnError?: number;
  fieldersChoice?: number;
  stolenBases?: number;
  caughtStealing?: number;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  teamName?: string;
  jerseyNumber?: string;
  photoPath?: string;
  graduationYear?: number;
  isActive?: boolean;
  isWeekendWarrior?: boolean;
  statsStartDate?: Date;
  statsEndDate?: Date;
  gamesPlayed?: number;
  plateAppearances?: number;
  atBats?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbis?: number;
  runs?: number;
  walks?: number;
  strikeouts?: number;
  strikeoutsLooking?: number;
  hitByPitch?: number;
  sacrificeHits?: number;
  sacrificeFlies?: number;
  reachedOnError?: number;
  fieldersChoice?: number;
  stolenBases?: number;
  caughtStealing?: number;
}

export interface CreateSessionDto {
  isRecurring: boolean;
  dayOfWeek?: number;
  startDate: Date;
  startTime: string;
  duration: number; // 30, 45, or 60
  playerId: number;
  isActive: boolean;
}

export interface UpdateSessionDto {
  isRecurring?: boolean;
  dayOfWeek?: number;
  startDate?: Date;
  startTime?: string;
  duration?: number; // 30, 45, or 60
  playerId?: number;
  isActive?: boolean;
}

export interface CreateSignageContentDto {
  title: string;
  contentType?: ContentType;
  filePath?: string;
  playerId?: number;
  isActive: boolean;
  order: number;
}

export interface UpdateSignageContentDto {
  title?: string;
  contentType?: ContentType;
  filePath?: string;
  playerId?: number;
  isActive?: boolean;
  order?: number;
}
