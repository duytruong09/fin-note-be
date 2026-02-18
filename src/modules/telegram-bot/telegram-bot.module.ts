import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramBotUpdate } from './telegram-bot.update';
import { TelegramAuthService } from './services/telegram-auth.service';
import { TelegramVoiceService } from './services/telegram-voice.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { VoiceModule } from '../voice/voice.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    VoiceModule,
    TransactionsModule,
  ],
  providers: [
    TelegramBotUpdate,
    TelegramAuthService,
    TelegramVoiceService,
  ],
  exports: [
    TelegramAuthService,
    TelegramVoiceService,
  ],
})
export class TelegramBotModule {}
