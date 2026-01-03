import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlayerEntity } from './player.entity';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'bit', default: false })
  isRecurring!: boolean;

  @Column({ type: 'int', nullable: true })
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for recurring sessions

  @Column({ type: 'datetime' })
  startDate!: Date; // Required for all sessions

  @Column({ type: 'varchar', length: 5 })
  startTime!: string; // HH:MM format (e.g., "18:00")

  @Column({ type: 'int' })
  duration!: number; // Duration in minutes (30, 45, or 60)

  @Column()
  playerId!: number;

  @Column({ type: 'bit', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => PlayerEntity, (player) => player.sessions)
  @JoinColumn({ name: 'playerId' })
  player?: PlayerEntity;
}
