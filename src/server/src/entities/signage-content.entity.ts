import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContentType } from '@shared/types';
import { PlayerEntity } from './player.entity';

@Entity('signage_content')
export class SignageContentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  contentType!: ContentType;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ nullable: true })
  playerId?: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => PlayerEntity, (player) => player.content, { nullable: true })
  @JoinColumn({ name: 'playerId' })
  player?: PlayerEntity;
}
