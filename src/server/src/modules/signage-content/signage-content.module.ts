import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignageContentEntity } from '../../entities';
import { SignageContentController } from './signage-content.controller';
import { SignageContentService } from './signage-content.service';

@Module({
  imports: [TypeOrmModule.forFeature([SignageContentEntity])],
  controllers: [SignageContentController],
  providers: [SignageContentService],
  exports: [SignageContentService],
})
export class SignageContentModule {}
