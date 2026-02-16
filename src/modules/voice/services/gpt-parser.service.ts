import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiService } from '@/infrastructure/ai/ai.service';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

// Zod schema for expense parsing
const ExpenseSchema = z.object({
  amount: z.number().describe('Amount in base currency (VND or USD)'),
  currency: z.string().default('VND').describe('Currency code'),
  category: z.string().describe('Category name in English'),
  description: z.string().describe('Brief description of the expense'),
  date: z.string().describe('Date in YYYY-MM-DD format'),
  paymentMethod: z
    .enum(['cash', 'card', 'bank_transfer', 'ewallet'])
    .optional()
    .describe('Payment method'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0 to 1'),
});

type ParsedExpense = z.infer<typeof ExpenseSchema>;

@Injectable()
export class GptParserService {
  private readonly logger = new Logger(GptParserService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Parse expense from transcript using GPT with structured output
   */
  async parseExpense(
    transcript: string,
    language: 'vi' | 'en',
  ): Promise<ParsedExpense> {
    if (!this.aiService.isConfigured()) {
      throw new BadRequestException('OpenAI API is not configured');
    }

    try {
      this.logger.log(`Parsing expense (${language}): "${transcript}"`);

      // Load appropriate prompt
      const promptFile = `expense-parser-${language}.txt`;
      const systemPrompt = await this.aiService.loadPrompt(promptFile);

      // Call GPT with structured output
      const openai = this.aiService.getClient();
      const model = this.aiService.getGptModel();

      const completion = await openai.beta.chat.completions.parse({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Parse the following expense:\n\n"${transcript}"\n\nCurrent date: ${new Date().toISOString().split('T')[0]}`,
          },
        ],
        response_format: zodResponseFormat(ExpenseSchema, 'expense'),
      });

      const parsed = completion.choices[0].message.parsed;

      if (!parsed) {
        throw new Error('Failed to parse GPT response');
      }

      this.logger.log(`Parsed expense:`, parsed);

      // Map payment method to uppercase enum
      if (parsed.paymentMethod) {
        parsed.paymentMethod = parsed.paymentMethod.toUpperCase() as any;
      }

      return parsed;
    } catch (error) {
      this.logger.error(`GPT parsing failed:`, error);

      if (error.status === 401) {
        throw new BadRequestException('Invalid OpenAI API key');
      }

      if (error.message?.includes('Prompt file')) {
        throw new BadRequestException(
          `Prompt file not found for language: ${language}`,
        );
      }

      throw new BadRequestException(`GPT parsing error: ${error.message}`);
    }
  }

  /**
   * Get model name used for parsing
   */
  getModelName(): string {
    return this.aiService.getGptModel();
  }
}
