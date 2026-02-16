import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { WhisperService } from './services/whisper.service';
import { GeminiSpeechService } from './services/gemini-speech.service';
import { GptParserService } from './services/gpt-parser.service';
import { GeminiParserService } from './services/gemini-parser.service';
import { VoiceStorageService } from './services/voice-storage.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [VoiceController],
  providers: [
    VoiceService,
    WhisperService,
    GeminiSpeechService,
    GptParserService,
    GeminiParserService,
    VoiceStorageService,
  ],
  exports: [VoiceService],
})
export class VoiceModule {}
