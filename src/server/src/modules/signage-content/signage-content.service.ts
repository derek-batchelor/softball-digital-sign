import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SignageContentEntity } from '../../entities';
import { CreateSignageContentDto, UpdateSignageContentDto, ContentType } from '@shared/types';
import { writeFile } from 'node:fs/promises';
import { join, isAbsolute, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { savePhotoAsWebp, ensureDirExists } from '../../services/media-optimizer.service';

@Injectable()
export class SignageContentService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(SignageContentEntity)
    private readonly contentRepository: Repository<SignageContentEntity>,
    private readonly configService: ConfigService,
  ) {
    const mediaPath = this.configService.get<string>('MEDIA_PATH');
    if (!mediaPath) {
      throw new Error('MEDIA_PATH environment variable is not configured');
    }
    this.uploadDir = isAbsolute(mediaPath) ? mediaPath : join(process.cwd(), mediaPath);
  }

  private inferContentType(filePath: string): ContentType {
    const ext = extname(filePath).toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    if (videoExtensions.includes(ext)) {
      return ContentType.VIDEO;
    } else if (imageExtensions.includes(ext)) {
      return ContentType.IMAGE;
    }
    // Default to IMAGE if unknown
    return ContentType.IMAGE;
  }

  async findAll(): Promise<SignageContentEntity[]> {
    return this.contentRepository.find({
      relations: ['player'],
      order: { order: 'ASC' },
    });
  }

  async findActive(): Promise<SignageContentEntity[]> {
    return this.contentRepository.find({
      where: { isActive: true },
      relations: ['player'],
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number): Promise<SignageContentEntity> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['player'],
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async getRandomFallback(): Promise<SignageContentEntity | null> {
    const activeContent = await this.findActive();
    if (activeContent.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * activeContent.length);
    return activeContent[randomIndex];
  }

  async create(createSignageContentDto: CreateSignageContentDto): Promise<SignageContentEntity> {
    // Infer content type from filePath if not provided
    let contentType = createSignageContentDto.contentType;

    if (createSignageContentDto.filePath && !contentType) {
      contentType = this.inferContentType(createSignageContentDto.filePath);
    }

    const content = this.contentRepository.create({
      ...createSignageContentDto,
      contentType: contentType || ContentType.IMAGE,
    });
    return this.contentRepository.save(content);
  }

  async saveUploadedFile(file: Express.Multer.File): Promise<{ filePath: string }> {
    console.log('saveUploadedFile called with file:', file ? file.originalname : 'no file');
    const ext = extname(file.originalname).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    if (imageExtensions.includes(ext)) {
      const { filePath } = await savePhotoAsWebp(file, this.uploadDir, '/media/');
      console.log('Image converted to webp and saved at:', filePath);
      return { filePath };
    }

    // NOTE: Video optimization with FFmpeg (x264, 720p max) will be implemented later.
    // For now, save the original video as-is
    await ensureDirExists(this.uploadDir);
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = join(this.uploadDir, filename);
    console.log('Writing video file to:', filepath);
    await writeFile(filepath, file.buffer);
    console.log('Video file written successfully');
    const result = { filePath: `/media/${filename}` };
    console.log('Returning result:', result);
    return result;
  }

  async update(
    id: number,
    updateSignageContentDto: UpdateSignageContentDto,
  ): Promise<SignageContentEntity> {
    const content = await this.findOne(id);

    // If filePath is being updated, delete the old file and re-infer content type
    if (updateSignageContentDto.filePath && updateSignageContentDto.filePath !== content.filePath) {
      // Delete old file if it exists
      if (content.filePath) {
        try {
          const filename = content.filePath.replace('/media/', '');
          const fullPath = join(this.uploadDir, filename);

          if (existsSync(fullPath)) {
            const { unlink } = await import('node:fs/promises');
            await unlink(fullPath);
            console.log(`Deleted old file: ${fullPath}`);
          }
        } catch (error) {
          console.error('Error deleting old file:', error);
        }
      }

      // Infer content type for new file
      const newContentType = this.inferContentType(updateSignageContentDto.filePath);
      updateSignageContentDto.contentType = newContentType;
    }

    Object.assign(content, updateSignageContentDto);
    return this.contentRepository.save(content);
  }

  async remove(id: number): Promise<void> {
    const content = await this.findOne(id);

    // Delete the associated file if it exists
    if (content.filePath) {
      try {
        // Extract the filename from the filePath (format: /media/filename)
        const filename = content.filePath.replace('/media/', '');
        const fullPath = join(this.uploadDir, filename);

        if (existsSync(fullPath)) {
          const { unlink } = await import('node:fs/promises');
          await unlink(fullPath);
        }
      } catch (error) {
        // Log the error but don't fail the deletion
        console.error('Error deleting file:', error);
      }
    }

    await this.contentRepository.remove(content);
  }
}
