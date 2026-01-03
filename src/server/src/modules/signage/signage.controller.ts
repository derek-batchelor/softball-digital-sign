import { Controller, Get } from '@nestjs/common';
import { SignageService } from './signage.service';

@Controller('signage')
export class SignageController {
  constructor(private readonly signageService: SignageService) {}

  @Get('active')
  async getActiveSignageData() {
    return this.signageService.getActiveSignageData();
  }

  @Get('fallback')
  async getFallbackContent() {
    return this.signageService.getFallbackContent();
  }
}
