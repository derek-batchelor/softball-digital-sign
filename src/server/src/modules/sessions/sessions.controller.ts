import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from '@shared/types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClaimsGuard } from '../../auth/guards/claims.guard';

@UseGuards(JwtAuthGuard, ClaimsGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.sessionsService.findActiveSession();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.remove(id);
  }
}
