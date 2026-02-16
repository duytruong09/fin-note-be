import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiService } from '@/infrastructure/ai/gemini.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class GeminiParserService {
  private readonly logger = new Logger(GeminiParserService.name);

  constructor(private readonly geminiService: GeminiService) {}

  /**
   * Parse expense from transcript using Gemini
   */
  async parseExpense(
    transcript: string,
    language: 'vi' | 'en',
  ): Promise<any> {
    if (!this.geminiService.isConfigured()) {
      throw new BadRequestException('Gemini API is not configured');
    }

    try {
      this.logger.log(`Parsing expense with Gemini (${language}): "${transcript}"`);

      // Load prompt
      const promptFile = path.join(process.cwd(), '.prompt', `expense-parser-${language}.txt`);
      const systemPrompt = await fs.readFile(promptFile, 'utf-8');

      // Expected schema
      const schema = {
        amount: 'number (amount in base currency)',
        currency: 'string (default: VND)',
        category: 'string (category name in English)',
        description: 'string (brief description)',
        date: 'string (YYYY-MM-DD format)',
        paymentMethod: 'string (cash|card|bank_transfer|ewallet) optional',
        confidence: 'number (0 to 1)',
      };

      const currentDate = new Date().toISOString().split('T')[0];

      const fullPrompt = `${systemPrompt}\n\n---\n\nCurrent date: ${currentDate}\n\nUser input: "${transcript}"\n\nParse this expense and return the structured data.`;

      const parsed = await this.geminiService.parseStructured(fullPrompt, schema);

      this.logger.log(`Gemini parsed:`, parsed);

      // Validate and normalize
      if (!parsed.amount || !parsed.category) {
        parsed.confidence = Math.min(parsed.confidence || 0, 0.5);
      }

      // Normalize payment method
      if (parsed.paymentMethod) {
        parsed.paymentMethod = parsed.paymentMethod.toUpperCase();
      }

      // Default confidence if not provided
      if (typeof parsed.confidence !== 'number') {
        parsed.confidence = 0.85;
      }

      // Default currency if not provided
      if (!parsed.currency) {
        parsed.currency = 'VND';
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Gemini parsing failed:`, error);

      if (error.message?.includes('API key')) {
        throw new BadRequestException('Invalid Gemini API key');
      }

      throw new BadRequestException(`Gemini parsing error: ${error.message}`);
    }
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return 'gemini-2.5-flash';
  }
}
