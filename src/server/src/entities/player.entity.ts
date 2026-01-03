import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { SignageContentEntity } from './signage-content.entity';

@Entity('players')
export class PlayerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  teamName?: string;

  @Column({ nullable: true })
  jerseyNumber?: string;

  @Column({ nullable: true })
  photoPath?: string;

  @Column({ nullable: true })
  graduationYear?: number;
  @Column({ type: 'bit', default: true })
  isActive!: boolean;

  @Column({ type: 'bit', default: false })
  isWeekendWarrior!: boolean;

  @Column({ type: 'date', nullable: true })
  statsStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  statsEndDate?: Date;

  // Stats fields
  @Column({ default: 0 })
  gamesPlayed!: number;

  @Column({ default: 0 })
  plateAppearances!: number;

  @Column({ default: 0 })
  atBats!: number;

  @Column({ default: 0 })
  hits!: number;

  @Column({ default: 0 })
  doubles!: number;

  @Column({ default: 0 })
  triples!: number;

  @Column({ default: 0 })
  homeRuns!: number;

  @Column({ default: 0 })
  rbis!: number;

  @Column({ default: 0 })
  runs!: number;

  @Column({ default: 0 })
  walks!: number;

  @Column({ default: 0 })
  strikeouts!: number;

  @Column({ default: 0 })
  strikeoutsLooking!: number;

  @Column({ default: 0 })
  hitByPitch!: number;

  @Column({ default: 0 })
  sacrificeHits!: number;

  @Column({ default: 0 })
  sacrificeFlies!: number;

  @Column({ default: 0 })
  reachedOnError!: number;

  @Column({ default: 0 })
  fieldersChoice!: number;

  @Column({ default: 0 })
  stolenBases!: number;

  @Column({ default: 0 })
  caughtStealing!: number;

  // Calculated stats
  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  battingAverage?: number;

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  onBasePercentage?: number;

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  sluggingPercentage?: number;

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  onBasePlusSlugging?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  stolenBasePercentage?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => SessionEntity, (session) => session.player)
  sessions?: SessionEntity[];

  @OneToMany(() => SignageContentEntity, (content) => content.player)
  content?: SignageContentEntity[];
}
