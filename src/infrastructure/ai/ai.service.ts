import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly whisperModel: string;
  private readonly gptModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-dummy-key', // Dummy key for when not configured
    });

    this.whisperModel = this.configService.get<string>('openai.whisperModel', 'whisper-1');
    this.gptModel = this.configService.get<string>(
      'openai.gptModel',
      'gpt-4o-mini-2024-07-18',
    );
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('openai.apiKey');
    return !!apiKey && apiKey !== 'sk-dummy-key';
  }

  /**
   * Get OpenAI client
   */
  getClient(): OpenAI {
    return this.openai;
  }

  /**
   * Get Whisper model name
   */
  getWhisperModel(): string {
    return this.whisperModel;
  }

  /**
   * Get GPT model name
   */
  getGptModel(): string {
    return this.gptModel;
  }

  /**
   * Load prompt from file
   */
  async loadPrompt(filename: string): Promise<string> {
    try {
      // Try to load from project root .prompt/ directory
      const promptPath = path.join(
        process.cwd(),
        '..',
        '.prompt',
        filename,
      );

      this.logger.debug(`Loading prompt from: ${promptPath}`);

      const content = await fs.readFile(promptPath, 'utf-8');
      return content;
    } catch (error) {
      this.logger.error(`Failed to load prompt ${filename}:`, error);
      throw new Error(`Prompt file ${filename} not found`);
    }
  }
}
