import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { WhisperService } from './services/whisper.service';
import { GptParserService } from './services/gpt-parser.service';
import { VoiceStorageService } from './services/voice-storage.service';
import { TransactionsService } from '../transactions/transactions.service';
import { ProcessingStatus } from '@prisma/client';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whisperService: WhisperService,
    private readonly gptParserService: GptParserService,
    private readonly voiceStorageService: VoiceStorageService,
    private readonly transactionsService: TransactionsService,
  ) {}

  /**
   * Main voice processing pipeline
   */
  async processVoiceInput(
    userId: string,
    language: 'vi' | 'en',
    audioFile: Express.Multer.File,
  ) {
    const startTime = Date.now();
    let audioUrl: string | null = null;
    let transcript: string | null = null;
    let parsedData: any = null;
    let status: ProcessingStatus = ProcessingStatus.SUCCESS;
    let errorMessage: string | null = null;

    try {
      this.logger.log(`Processing voice input for user ${userId}, language: ${language}`);

      // 1. Validate and store audio file
      audioUrl = await this.voiceStorageService.storeAudio(audioFile);
      const audioDuration = await this.voiceStorageService.getAudioDuration(audioFile);

      this.logger.log(`Audio stored at: ${audioUrl}, duration: ${audioDuration}s`);

      // 2. Transcribe with Whisper
      const whisperResult = await this.whisperService.transcribe(audioFile, language);
      transcript = whisperResult.text;

      this.logger.log(`Whisper transcript: "${transcript}"`);

      // 3. Parse with GPT
      parsedData = await this.gptParserService.parseExpense(transcript, language);

      this.logger.log(`GPT parsed:`, parsedData);

      // Determine status based on confidence
      if (parsedData.confidence < 0.5) {
        status = ProcessingStatus.PARTIAL_SUCCESS;
      }

      // 4. Log processing
      const processingTimeMs = Date.now() - startTime;

      const log = await this.prisma.voiceProcessingLog.create({
        data: {
          userId,
          audioUrl,
          audioDurationSec: audioDuration,
          whisperTranscript: transcript,
          whisperLanguage: whisperResult.language || language,
          whisperConfidence: 0.95, // Whisper doesn't provide confidence, use default
          gptParsedData: parsedData,
          gptModel: this.gptParserService.getModelName(),
          gptConfidence: parsedData.confidence,
          processingTimeMs,
          status,
        },
      });

      // 5. Return parsed data for user review
      return {
        data: {
          logId: log.id,
          transcript,
          parsed: parsedData,
          audioUrl,
          processingTimeMs,
          status,
        },
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;

      // Determine error type
      if (error.message?.includes('Whisper')) {
        status = ProcessingStatus.FAILED_WHISPER;
      } else if (error.message?.includes('GPT') || error.message?.includes('parse')) {
        status = ProcessingStatus.FAILED_PARSING;
      } else {
        status = ProcessingStatus.FAILED_UNKNOWN;
      }

      errorMessage = error.message;

      this.logger.error(`Voice processing failed:`, error);

      // Log failed processing
      if (audioUrl) {
        await this.prisma.voiceProcessingLog.create({
          data: {
            userId,
            audioUrl,
            audioDurationSec: 0,
            whisperTranscript: transcript || 'Failed to transcribe',
            whisperLanguage: language,
            whisperConfidence: 0,
            gptParsedData: parsedData || {},
            gptModel: this.gptParserService.getModelName(),
            gptConfidence: 0,
            processingTimeMs,
            status,
            errorMessage,
          },
        });
      }

      throw new BadRequestException(`Voice processing failed: ${error.message}`);
    }
  }

  /**
   * Test parsing without audio (for development/testing)
   */
  async testParsing(userId: string, transcript: string, language: 'vi' | 'en') {
    try {
      const parsedData = await this.gptParserService.parseExpense(transcript, language);

      return {
        data: {
          transcript,
          parsed: parsedData,
        },
      };
    } catch (error) {
      this.logger.error(`Test parsing failed:`, error);
      throw new BadRequestException(`Parsing failed: ${error.message}`);
    }
  }

  /**
   * Get processing logs
   */
  async getProcessingLogs(userId: string, page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;

    const [logs, total] = await Promise.all([
      this.prisma.voiceProcessingLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.voiceProcessingLog.count({
        where: { userId },
      }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get voice processing statistics
   */
  async getStatistics(userId: string) {
    const [
      totalProcessed,
      successCount,
      failedCount,
      avgConfidence,
      avgProcessingTime,
    ] = await Promise.all([
      this.prisma.voiceProcessingLog.count({ where: { userId } }),
      this.prisma.voiceProcessingLog.count({
        where: { userId, status: ProcessingStatus.SUCCESS },
      }),
      this.prisma.voiceProcessingLog.count({
        where: {
          userId,
          status: { not: ProcessingStatus.SUCCESS },
        },
      }),
      this.prisma.voiceProcessingLog.aggregate({
        where: { userId, status: ProcessingStatus.SUCCESS },
        _avg: { gptConfidence: true },
      }),
      this.prisma.voiceProcessingLog.aggregate({
        where: { userId },
        _avg: { processingTimeMs: true },
      }),
    ]);

    const successRate = totalProcessed > 0 ? (successCount / totalProcessed) * 100 : 0;

    return {
      data: {
        totalProcessed,
        successCount,
        failedCount,
        successRate: Math.round(successRate * 100) / 100,
        avgConfidence: avgConfidence._avg.gptConfidence || 0,
        avgProcessingTimeMs: avgProcessingTime._avg.processingTimeMs || 0,
      },
    };
  }
}
