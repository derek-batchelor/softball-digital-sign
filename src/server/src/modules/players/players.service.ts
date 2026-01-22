import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PlayerEntity } from '../../entities';
import { CreatePlayerDto, UpdatePlayerDto } from '@shared/types';
import { mkdir, unlink } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';
import { savePhotoAsWebp } from '../../services/media-optimizer.service';

@Injectable()
export class PlayersService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepository: Repository<PlayerEntity>,
    private readonly configService: ConfigService,
  ) {
    const mediaPath = this.configService.get<string>('MEDIA_PATH');
    if (!mediaPath) {
      throw new Error('MEDIA_PATH environment variable is not configured');
    }
    const basePath = isAbsolute(mediaPath) ? mediaPath : join(process.cwd(), mediaPath);
    this.uploadDir = join(basePath, 'player-photos');
  }

  private async ensureUploadDirExists() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async findAll(): Promise<PlayerEntity[]> {
    return this.playerRepository.find({
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PlayerEntity> {
    const player = await this.playerRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  async create(createPlayerDto: CreatePlayerDto): Promise<PlayerEntity> {
    const player = this.playerRepository.create(createPlayerDto);
    this.calculateDerivedStats(player);
    return this.playerRepository.save(player);
  }

  async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<PlayerEntity> {
    const player = await this.findOne(id);

    // If photo is being updated and there's an old photo, delete it
    if (
      updatePlayerDto.photoPath &&
      player.photoPath &&
      updatePlayerDto.photoPath !== player.photoPath
    ) {
      await this.deletePhotoFile(player.photoPath);
    }

    Object.assign(player, updatePlayerDto);
    this.calculateDerivedStats(player);
    return this.playerRepository.save(player);
  }

  private calculateDerivedStats(player: PlayerEntity): void {
    // Calculate batting average (AVG = H / AB)
    if (player.atBats > 0) {
      player.battingAverage = player.hits / player.atBats;
    } else {
      player.battingAverage = 0;
    }

    // Calculate on-base percentage (OBP = (H + BB + HBP) / (AB + BB + HBP + SF))
    const obpDenominator = player.atBats + player.walks + player.hitByPitch + player.sacrificeFlies;
    if (obpDenominator > 0) {
      player.onBasePercentage = (player.hits + player.walks + player.hitByPitch) / obpDenominator;
    } else {
      player.onBasePercentage = 0;
    }

    // Calculate slugging percentage (SLG = (1B + 2*2B + 3*3B + 4*HR) / AB)
    if (player.atBats > 0) {
      const singles = player.hits - player.doubles - player.triples - player.homeRuns;
      const totalBases = singles + 2 * player.doubles + 3 * player.triples + 4 * player.homeRuns;
      player.sluggingPercentage = totalBases / player.atBats;
    } else {
      player.sluggingPercentage = 0;
    }

    // Calculate on-base plus slugging (OPS = OBP + SLG)
    player.onBasePlusSlugging = player.onBasePercentage + player.sluggingPercentage;

    // Calculate stolen base percentage (SB% = SB / (SB + CS) * 100)
    const sbAttempts = player.stolenBases + player.caughtStealing;
    if (sbAttempts > 0) {
      player.stolenBasePercentage = (player.stolenBases / sbAttempts) * 100;
    } else {
      player.stolenBasePercentage = 0;
    }
  }

  async remove(id: number): Promise<void> {
    const player = await this.findOne(id);

    // Delete photo file if it exists
    if (player.photoPath) {
      await this.deletePhotoFile(player.photoPath);
    }

    await this.playerRepository.remove(player);
  }

  private async deletePhotoFile(photoPath: string): Promise<void> {
    try {
      // Extract filename from path like '/media/player-photos/filename.jpg'
      const filename = photoPath.split('/').pop();
      if (filename) {
        const filepath = join(this.uploadDir, filename);
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
      }
    } catch (error) {
      // Log but don't throw - we don't want photo deletion to block player updates/deletes
      console.error('Error deleting photo file:', error);
    }
  }

  async saveUploadedPhoto(file: Express.Multer.File): Promise<{ filePath: string }> {
    console.log('saveUploadedPhoto called with file:', file ? file.originalname : 'no file');

    await this.ensureUploadDirExists();
    console.log('Upload directory exists:', this.uploadDir);

    const { filePath } = await savePhotoAsWebp(file, this.uploadDir, '/media/player-photos/');
    console.log('Photo converted to webp and saved at:', filePath);
    return { filePath };
  }

  async setWeekendWarrior(id: number): Promise<PlayerEntity> {
    const player = await this.findOne(id);

    // Set this player as the weekend warrior
    player.isWeekendWarrior = true;
    return this.playerRepository.save(player);
  }
}
