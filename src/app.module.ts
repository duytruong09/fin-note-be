import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AiModule } from './infrastructure/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { VoiceModule } from './modules/voice/voice.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Infrastructure
    PrismaModule,
    AiModule,

    // Feature Modules
    HealthModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    VoiceModule,
    // BudgetsModule,
    // UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
