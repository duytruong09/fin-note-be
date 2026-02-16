import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (apiKey && apiKey !== 'your-gemini-api-key-here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.5-flash (latest stable, fast & free)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.logger.log('Gemini AI initialized with model: gemini-2.5-flash');
    } else {
      this.logger.warn('Gemini API key not configured');
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  getModel() {
    if (!this.model) {
      throw new Error('Gemini not configured');
    }
    return this.model;
  }

  /**
   * Generate content from text prompt
   */
  async generateContent(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API not configured');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Gemini generation failed', error);
      throw error;
    }
  }

  /**
   * Parse structured data with JSON output
   */
  async parseStructured(prompt: string, schema: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API not configured');
    }

    try {
      const fullPrompt = `${prompt}\n\nYou MUST respond with valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}\n\nRespond ONLY with JSON, no other text.`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Gemini structured parsing failed', error);
      throw error;
    }
  }
}
