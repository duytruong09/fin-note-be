import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';

@Global()
@Module({
  providers: [AiService, GeminiService],
  exports: [AiService, GeminiService],
})
export class AiModule {}
