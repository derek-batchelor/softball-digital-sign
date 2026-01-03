import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SignageContentService } from './signage-content.service';
import { CreateSignageContentDto, UpdateSignageContentDto } from '@shared/types';

@Controller('content')
export class SignageContentController {
  constructor(private readonly signageContentService: SignageContentService) {}

  @Get()
  findAll() {
    return this.signageContentService.findAll();
  }

  @Get('active')
  findActive() {
    return this.signageContentService.findActive();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.signageContentService.findOne(id);
  }

  @Post()
  create(@Body() createSignageContentDto: CreateSignageContentDto) {
    return this.signageContentService.create(createSignageContentDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      console.log('Upload endpoint called, file:', file ? file.originalname : 'no file');
      const result = await this.signageContentService.saveUploadedFile(file);
      console.log('Upload successful, returning:', result);
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSignageContentDto: UpdateSignageContentDto,
  ) {
    return this.signageContentService.update(id, updateSignageContentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.signageContentService.remove(id);
  }
}
