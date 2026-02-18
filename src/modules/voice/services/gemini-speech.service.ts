import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFile } from 'fs/promises';

@Injectable()
export class GeminiSpeechService {
  private readonly logger = new Logger(GeminiSpeechService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      this.logger.warn('Gemini API key not configured');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for audio support
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.logger.log('Gemini Speech-to-Text initialized with model: gemini-2.5-flash');
  }

  isConfigured(): boolean {
    return !!this.model;
  }

  /**
   * Transcribe audio file using Gemini (supports audio input)
   */
  async transcribe(
    audioFile: Express.Multer.File,
    language?: 'vi' | 'en',
  ): Promise<{
    text: string;
    language?: string;
    duration?: number;
  }> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Gemini API is not configured');
    }

    try {
      this.logger.log(`Transcribing audio file with Gemini: ${audioFile.originalname}`);

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

      // Convert buffer to base64 for Gemini
      const audioBase64 = audioFile.buffer.toString('base64');

      // Map mimetype to Gemini's format
      let mimeType = audioFile.mimetype;
      if (mimeType === 'audio/x-m4a') {
        mimeType = 'audio/mp4'; // Gemini uses audio/mp4 for m4a
      }

      // Prepare audio part for Gemini
      const audioPart = {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType,
        },
      };

      // Prompt for transcription
      const languageHint = language === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English';
      const prompt = `Please transcribe this audio file to text. The language is ${languageHint}.

IMPORTANT: Return ONLY the transcribed text, nothing else. Do not add any explanations, notes, or comments.`;

      // Call Gemini with audio
      const result = await this.model.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text().trim();

      this.logger.log(`Gemini transcription successful: "${text}"`);

      return {
        text,
        language: language || 'vi',
        duration: undefined, // Gemini doesn't provide duration
      };
    } catch (error) {
      this.logger.error(`Gemini transcription failed:`, error);

      if (error.message?.includes('API key')) {
        throw new BadRequestException('Invalid Gemini API key');
      }

      throw new BadRequestException(`Gemini transcription error: ${error.message}`);
    }
  }
}
