import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * Process voice input - upload audio, transcribe, parse
   */
  @Post('process')
  @UseInterceptors(FileInterceptor('audio'))
  async processVoice(
    @CurrentUser() user: any,
    @UploadedFile() audioFile: Express.Multer.File,
    @Body('language') language?: 'vi' | 'en',
  ) {
    if (!audioFile) {
      throw new BadRequestException('Audio file is required');
    }

    return this.voiceService.processVoiceInput(
      user.id,
      user.preferredLanguage || language || 'vi',
      audioFile,
    );
  }

  /**
   * Test parsing with a transcript (no audio upload)
   */
  @Post('test-parse')
  async testParse(
    @CurrentUser() user: any,
    @Body('transcript') transcript: string,
    @Body('language') language?: 'vi' | 'en',
  ) {
    if (!transcript) {
      throw new BadRequestException('Transcript is required');
    }

    return this.voiceService.testParsing(
      user.id,
      transcript,
      language || user.preferredLanguage || 'vi',
    );
  }

  /**
   * Get voice processing logs
   */
  @Get('logs')
  async getLogs(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 20,
  ) {
    return this.voiceService.getProcessingLogs(user.id, page, perPage);
  }

  /**
   * Get voice processing statistics
   */
  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.voiceService.getStatistics(user.id);
  }
}
