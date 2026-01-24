import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlayersService } from './players.service';
import { CreatePlayerDto, UpdatePlayerDto } from '@shared/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClaimsGuard } from '../../auth/guards/claims.guard';

@UseGuards(JwtAuthGuard, ClaimsGuard)
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }

  @Post()
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.update(id, updatePlayerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.remove(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    try {
      console.log('Upload endpoint called, file:', file ? file.originalname : 'no file');
      const result = await this.playersService.saveUploadedPhoto(file);
      console.log('Upload successful, returning:', result);
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  @Patch(':id/weekend-warrior')
  setWeekendWarrior(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.setWeekendWarrior(id);
  }
}
