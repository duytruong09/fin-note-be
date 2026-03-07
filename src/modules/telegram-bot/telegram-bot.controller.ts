import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { TelegramBotUpdate } from './telegram-bot.update';

@Controller('telegram')
export class TelegramBotController {
  constructor(private readonly telegramBotUpdate: TelegramBotUpdate) {}

  /**
   * Get Telegram bot status
   * GET /api/v1/telegram/status
   */
  @Get('status')
  getBotStatus() {
    const status = this.telegramBotUpdate.getBotStatus();

    return {
      data: {
        ...status,
        statusText: status.isRunning ? 'running' : 'stopped',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Restart Telegram bot
   * POST /api/v1/telegram/restart
   */
  @Post('restart')
  @HttpCode(HttpStatus.OK)
  async restartBot() {
    await this.telegramBotUpdate.restartBot();

    return {
      data: {
        message: 'Telegram bot restart initiated',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Stop Telegram bot
   * POST /api/v1/telegram/stop
   */
  @Post('stop')
  @HttpCode(HttpStatus.OK)
  async stopBot() {
    await this.telegramBotUpdate.stopBot();

    return {
      data: {
        message: 'Telegram bot stopped',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Start Telegram bot
   * POST /api/v1/telegram/start
   */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startBot() {
    await this.telegramBotUpdate.startBot();

    return {
      data: {
        message: 'Telegram bot start initiated',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
