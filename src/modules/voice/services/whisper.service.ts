import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiService } from '@/infrastructure/ai/ai.service';
import { createReadStream } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribe(
    audioFile: Express.Multer.File,
    language?: 'vi' | 'en',
  ): Promise<{
    text: string;
    language?: string;
    duration?: number;
  }> {
    if (!this.aiService.isConfigured()) {
      throw new BadRequestException('OpenAI API is not configured');
    }

    let tempFilePath: string | null = null;

    try {
      this.logger.log(`Transcribing audio file: ${audioFile.originalname}`);

      // Validate file type
      const allowedMimeTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/m4a',
        'audio/mp4',
        'audio/x-m4a',
      ];

      if (!allowedMimeTypes.includes(audioFile.mimetype)) {
        throw new BadRequestException(
          `Invalid audio format. Allowed: ${allowedMimeTypes.join(', ')}`,
        );
      }

      // Create temp file (Whisper API needs file path)
      tempFilePath = join(
        process.cwd(),
        'uploads',
        `temp-${Date.now()}-${audioFile.originalname}`,
      );

      await writeFile(tempFilePath, audioFile.buffer);

      // Call Whisper API
      const openai = this.aiService.getClient();
      const model = this.aiService.getWhisperModel();

      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(tempFilePath),
        model,
        language: language || undefined,
        response_format: 'verbose_json',
      });

      this.logger.log(`Transcription successful: "${transcription.text}"`);

      return {
        text: transcription.text,
        language: transcription.language || language,
        duration: transcription.duration,
      };
    } catch (error) {
      this.logger.error(`Whisper transcription failed:`, error);

      if (error.status === 401) {
        throw new BadRequestException('Invalid OpenAI API key');
      }

      throw new BadRequestException(`Whisper API error: ${error.message}`);
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
        } catch (err) {
          this.logger.warn(`Failed to delete temp file: ${tempFilePath}`);
        }
      }
    }
  }
}
