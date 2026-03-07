import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AiModule } from './infrastructure/ai/ai.module';
import { SettingsModule } from './infrastructure/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { VoiceModule } from './modules/voice/voice.module';
import { HealthModule } from './modules/health/health.module';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UserSettingsModule } from './modules/user-settings/user-settings.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Infrastructure
    PrismaModule,
    SettingsModule,
    AiModule,

    // Feature Modules
    HealthModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    VoiceModule,
    TelegramBotModule,
    BudgetsModule,
    ReportsModule,
    UserSettingsModule,
    // UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
