import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf, Context, Markup } from 'telegraf';
import { Update } from 'telegraf/types';
import { SettingsService } from '@/infrastructure/settings/settings.service';
import { TelegramAuthService } from './services/telegram-auth.service';
import { TelegramVoiceService } from './services/telegram-voice.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TelegramUserDto } from './dto/telegram-user.dto';

@Injectable()
export class TelegramBotUpdate implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotUpdate.name);
  private bot: Telegraf;
  private botToken: string;
  private isRunning = false;
  private maxRetries = 5;
  private retryCount = 0;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly telegramAuthService: TelegramAuthService,
    private readonly telegramVoiceService: TelegramVoiceService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async onModuleInit() {
    try {
      // Get bot token from database
      this.botToken = await this.settingsService.get('telegram_bot_token');

      if (!this.botToken) {
        this.logger.warn(
          '⚠️  Telegram bot token not found in settings. ' +
          'Please set it in the database with key "telegram_bot_token"'
        );
        return;
      }

      // Start bot with auto-recovery
      await this.startBot();
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot', error);
    }
  }

  async onModuleDestroy() {
    await this.stopBot();
  }

  private setupCommands() {
    // /start command
    this.bot.command('start', async (ctx) => {
      try {
        const user = await this.registerUser(ctx);
        const name = ctx.from?.first_name || 'bạn';

        await ctx.reply(
          `👋 Xin chào ${name}!\n\n` +
            `🎙 *Fin-Note Voice Bot*\n\n` +
            `Tôi sẽ giúp bạn ghi lại chi tiêu bằng giọng nói.\n\n` +
            `*Cách sử dụng:*\n` +
            `• Gửi tin nhắn thoại: "Hôm nay ăn cơm 50 nghìn"\n` +
            `• Hoặc gửi tin nhắn text: "Mua cafe 30k"\n\n` +
            `Gõ /help để xem thêm hướng dẫn.`,
          { parse_mode: 'Markdown' },
        );
      } catch (error) {
        this.logger.error('Error in /start command', error);
        await ctx.reply('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    });

    // /help command
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        `📖 *Hướng dẫn sử dụng Fin-Note Bot*\n\n` +
          `*Commands:*\n` +
          `/start - Bắt đầu sử dụng bot\n` +
          `/help - Xem hướng dẫn\n` +
          `/stats - Xem thống kê\n` +
          `/today - Giao dịch hôm nay\n` +
          `/categories - Xem danh mục\n\n` +
          `*Ghi chi tiêu bằng giọng nói:*\n` +
          `1. Bấm 🎤 để ghi âm\n` +
          `2. Nói: "Hôm nay ăn sáng 30 nghìn"\n` +
          `3. Bot sẽ phân tích và hỏi xác nhận\n` +
          `4. Bấm ✅ Confirm để lưu\n\n` +
          `*Ghi chi tiêu bằng text:*\n` +
          `Gửi tin nhắn: "Mua cafe 25k" hoặc "Taxi 100 nghìn"\n\n` +
          `*Ví dụ:*\n` +
          `• "Ăn trưa 50k"\n` +
          `• "Mua sách 200 nghìn"\n` +
          `• "Nhận lương 10 triệu" (thu nhập)`,
        { parse_mode: 'Markdown' },
      );
    });

    // /stats command
    this.bot.command('stats', async (ctx) => {
      try {
        const user = await this.registerUser(ctx);
        const userId = user.id;

        // Get today's transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactions = await this.transactionsService.findAll(userId, {
          startDate: today.toISOString(),
          page: 1,
          perPage: 100,
        });

        const expenses = transactions.data.filter((t) => t.type === 'EXPENSE');
        const incomes = transactions.data.filter((t) => t.type === 'INCOME');

        const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalIncome = incomes.reduce((sum, t) => sum + Number(t.amount), 0);

        await ctx.reply(
          `📊 *Thống kê hôm nay*\n\n` +
            `💸 Chi tiêu: ${this.formatMoney(totalExpense)} (${expenses.length} giao dịch)\n` +
            `💰 Thu nhập: ${this.formatMoney(totalIncome)} (${incomes.length} giao dịch)\n` +
            `📈 Tổng: ${this.formatMoney(totalIncome - totalExpense)}`,
          { parse_mode: 'Markdown' },
        );
      } catch (error) {
        this.logger.error('Error in /stats command', error);
        await ctx.reply('Không thể lấy thống kê. Vui lòng thử lại.');
      }
    });

    // /today command
    this.bot.command('today', async (ctx) => {
      try {
        const user = await this.registerUser(ctx);
        const userId = user.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactions = await this.transactionsService.findAll(userId, {
          startDate: today.toISOString(),
          page: 1,
          perPage: 20,
        });

        if (transactions.data.length === 0) {
          await ctx.reply('📋 Chưa có giao dịch nào hôm nay.');
          return;
        }

        let message = `📋 *Giao dịch hôm nay (${transactions.data.length})*\n\n`;

        transactions.data.forEach((t, index) => {
          const icon = t.type === 'EXPENSE' ? '💸' : '💰';
          const category = t.category ? `[${t.category.name}]` : '';
          message += `${index + 1}. ${icon} ${this.formatMoney(Number(t.amount))} ${category}\n`;
          if (t.description) {
            message += `   _${t.description}_\n`;
          }
        });

        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error) {
        this.logger.error('Error in /today command', error);
        await ctx.reply('Không thể lấy danh sách giao dịch. Vui lòng thử lại.');
      }
    });

    // /categories command
    this.bot.command('categories', async (ctx) => {
      await ctx.reply(
        `📂 *Danh mục chi tiêu*\n\n` +
          `🍜 Ăn uống\n` +
          `🚗 Di chuyển\n` +
          `🏠 Nhà cửa\n` +
          `👕 Quần áo\n` +
          `💊 Sức khỏe\n` +
          `🎮 Giải trí\n` +
          `📚 Giáo dục\n` +
          `🛍 Mua sắm\n` +
          `💡 Khác\n\n` +
          `Bot sẽ tự động nhận diện danh mục khi bạn ghi chi tiêu.`,
        { parse_mode: 'Markdown' },
      );
    });
  }

  private setupMessageHandlers() {
    // Voice message handler
    this.bot.on('voice', async (ctx) => {
      try {
        const user = await this.registerUser(ctx);
        const userId = user.id;

        await ctx.reply('🎙 Đang xử lý tin nhắn thoại...');

        const fileId = ctx.message.voice.file_id;
        const language = await this.telegramAuthService.getUserLanguage(
          ctx.from.id.toString(),
        );

        // Process voice
        const result = await this.telegramVoiceService.processVoiceMessage(
          this.bot,
          userId,
          fileId,
          language,
        );

        const parsed = result.data.parsed;

        // Show parsed result with confirmation buttons
        await ctx.reply(
          `✅ *Đã nhận diện:*\n\n` +
            `💰 Số tiền: ${this.formatMoney(parsed.amount)}\n` +
            `📂 Danh mục: ${parsed.category || 'Không xác định'}\n` +
            `📝 Mô tả: ${parsed.description || '-'}\n` +
            `📊 Loại: ${parsed.type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}\n` +
            `🎯 Độ chính xác: ${Math.round(parsed.confidence * 100)}%\n\n` +
            `_Transcript: "${result.data.transcript}"_`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback('✅ Xác nhận', `confirm:${result.data.logId}`),
                Markup.button.callback('❌ Hủy', `cancel:${result.data.logId}`),
              ],
            ]),
          },
        );
      } catch (error) {
        this.logger.error('Error processing voice message', error);
        await ctx.reply('❌ Không thể xử lý tin nhắn thoại. Vui lòng thử lại.');
      }
    });

    // Text message handler
    this.bot.on('text', async (ctx) => {
      // Skip if it's a command
      if (ctx.message.text.startsWith('/')) {
        return;
      }

      try {
        const user = await this.registerUser(ctx);
        const userId = user.id;

        const text = ctx.message.text;
        const language = await this.telegramAuthService.getUserLanguage(
          ctx.from.id.toString(),
        );

        await ctx.reply('📝 Đang phân tích...');

        // Process text as expense
        const result = await this.telegramVoiceService.processTextMessage(
          userId,
          text,
          language,
        );

        const parsed = result.data.parsed;

        await ctx.reply(
          `✅ *Đã nhận diện:*\n\n` +
            `💰 Số tiền: ${this.formatMoney(parsed.amount)}\n` +
            `📂 Danh mục: ${parsed.category || 'Không xác định'}\n` +
            `📝 Mô tả: ${parsed.description || '-'}\n` +
            `📊 Loại: ${parsed.type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}\n` +
            `🎯 Độ chính xác: ${Math.round(parsed.confidence * 100)}%`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback('✅ Xác nhận', `confirm:${result.data.logId}`),
                Markup.button.callback('❌ Hủy', `cancel:${result.data.logId}`),
              ],
            ]),
          },
        );
      } catch (error) {
        this.logger.error('Error processing text message', error);
        await ctx.reply('❌ Không thể phân tích tin nhắn. Vui lòng thử lại.');
      }
    });
  }

  private setupCallbackHandlers() {
    // Handle confirm button
    this.bot.action(/^confirm:(.+)$/, async (ctx) => {
      try {
        const logId = ctx.match[1];
        const user = await this.registerUser(ctx);
        const userId = user.id;

        // Get parsed data from log
        const log = await this.transactionsService['prisma'].voiceProcessingLog.findUnique({
          where: { id: logId },
        });

        if (!log) {
          await ctx.answerCbQuery('Không tìm thấy dữ liệu');
          return;
        }

        const parsed = log.gptParsedData as any;

        // Create transaction
        await this.transactionsService.create(userId, {
          amount: parsed.amount,
          type: parsed.type,
          description: parsed.description,
          categoryId: parsed.categoryId,
          transactionDate: parsed.date || new Date().toISOString(),
        });

        await ctx.editMessageText(
          `✅ *Đã lưu giao dịch!*\n\n` +
            `💰 ${this.formatMoney(parsed.amount)} - ${parsed.description || 'Chi tiêu'}`,
          { parse_mode: 'Markdown' },
        );
        await ctx.answerCbQuery('✅ Đã lưu giao dịch');
      } catch (error) {
        this.logger.error('Error confirming transaction', error);
        await ctx.answerCbQuery('❌ Lỗi khi lưu giao dịch');
      }
    });

    // Handle cancel button
    this.bot.action(/^cancel:(.+)$/, async (ctx) => {
      await ctx.editMessageText('❌ Đã hủy giao dịch.');
      await ctx.answerCbQuery('Đã hủy');
    });
  }

  private async registerUser(ctx: Context): Promise<any> {
    const from = ctx.from;
    if (!from) {
      throw new Error('No user information');
    }

    const telegramUserDto: TelegramUserDto = {
      telegramId: from.id.toString(),
      chatId: ctx.chat?.id.toString() || from.id.toString(),
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      languageCode: from.language_code,
      isBot: from.is_bot,
      isPremium: (from as any).is_premium,
    };

    return this.telegramAuthService.registerOrGetTelegramUser(telegramUserDto);
  }

  private formatMoney(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Start Telegram bot with auto-recovery for 409 errors
   */
  async startBot(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('⚠️  Bot is already running');
      return;
    }

    if (!this.botToken) {
      this.logger.error('❌ Cannot start bot: token not available');
      return;
    }

    try {
      // Initialize bot with token
      this.bot = new Telegraf(this.botToken);

      // Setup handlers
      this.setupCommands();
      this.setupMessageHandlers();
      this.setupCallbackHandlers();

      // Launch bot
      await this.bot.launch();
      this.isRunning = true;
      this.retryCount = 0;
      this.logger.log('✅ Telegram bot started successfully');

      // Enable graceful stop
      process.once('SIGINT', () => this.stopBot());
      process.once('SIGTERM', () => this.stopBot());
    } catch (error) {
      await this.handleStartError(error);
    }
  }

  /**
   * Stop Telegram bot gracefully
   */
  async stopBot(): Promise<void> {
    if (!this.isRunning || !this.bot) {
      this.logger.warn('⚠️  Bot is not running');
      return;
    }

    try {
      this.logger.log('🛑 Stopping Telegram bot...');
      await this.bot.stop();
      this.isRunning = false;
      this.logger.log('✅ Telegram bot stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping bot', error);
      this.isRunning = false;
    }
  }

  /**
   * Restart Telegram bot
   */
  async restartBot(): Promise<void> {
    this.logger.log('🔄 Restarting Telegram bot...');
    await this.stopBot();

    // Wait a bit before restarting to ensure clean shutdown
    await this.sleep(2000);

    await this.startBot();
  }

  /**
   * Handle errors when starting bot
   */
  private async handleStartError(error: any): Promise<void> {
    const errorMessage = error?.message || String(error);

    // Check if it's a 409 Conflict error
    if (errorMessage.includes('409') && errorMessage.includes('Conflict')) {
      this.logger.warn(
        `⚠️  409 Conflict detected: Another bot instance is running. ` +
        `Attempting to recover... (Retry ${this.retryCount + 1}/${this.maxRetries})`
      );

      // Stop existing bot instance
      try {
        if (this.bot) {
          await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
        }
      } catch (webhookError) {
        this.logger.debug('Failed to delete webhook (might not exist)', webhookError);
      }

      // Retry with exponential backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000); // Max 30s

        this.logger.log(`⏳ Waiting ${delay}ms before retry...`);
        await this.sleep(delay);

        return this.startBot();
      } else {
        this.logger.error(
          `❌ Failed to start bot after ${this.maxRetries} retries. ` +
          `Please check if there are other instances running or restart manually.`
        );
      }
    } else {
      // Other errors
      this.logger.error('Failed to start Telegram bot', error);
    }
  }

  /**
   * Get bot status
   */
  getBotStatus(): { isRunning: boolean; retryCount: number } {
    return {
      isRunning: this.isRunning,
      retryCount: this.retryCount,
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
