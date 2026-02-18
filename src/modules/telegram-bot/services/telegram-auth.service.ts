import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/infrastructure/database/prisma.service";
import { TelegramUserDto } from "../dto/telegram-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or get existing Telegram user
   * Returns User object with settings
   */
  async registerOrGetTelegramUser(telegramUserData: TelegramUserDto) {
    const { telegramId, chatId } = telegramUserData;

    // Check if user with this telegram ID exists
    const existingSettings = await this.prisma.userSettings.findFirst({
      where: { telegramUserId: telegramId },
      include: { user: true },
    });

    if (existingSettings) {
      // Update chat ID if changed
      if (existingSettings.telegramChatId !== chatId) {
        await this.prisma.userSettings.update({
          where: { userId: existingSettings.userId },
          data: { telegramChatId: chatId },
        });
      }

      this.logger.log(
        `Existing Telegram user: ${telegramId} -> User ID: ${existingSettings.userId}`,
      );
      return existingSettings.user;
    }

    // Create new user and link with Telegram
    const newUser = await this.prisma.user.create({
      data: {
        email: `telegram_${telegramId}@finnote.app`,
        passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
        fullName:
          [telegramUserData.firstName, telegramUserData.lastName]
            .filter(Boolean)
            .join(" ") || "Telegram User",
        preferredLanguage: telegramUserData.languageCode === "vi" ? "vi" : "en",
      },
    });

    // Create user settings with Telegram info
    await this.prisma.userSettings.create({
      data: {
        userId: newUser.id,
        telegramChatId: chatId,
        telegramUserId: telegramId,
        voiceDefaultLang: telegramUserData.languageCode === "vi" ? "vi" : "en",
      },
    });

    this.logger.log(
      `New Telegram user created: ${telegramId} -> User ID: ${newUser.id}`,
    );
    return newUser;
  }

  /**
   * Get user by Telegram ID
   */
  async getUserByTelegramId(telegramId: string) {
    const userSettings = await this.prisma.userSettings.findFirst({
      where: { telegramUserId: telegramId },
      include: { user: true },
    });

    if (!userSettings) {
      throw new NotFoundException("Telegram user not found");
    }

    return userSettings.user;
  }

  /**
   * Get user's Telegram chat ID for sending messages
   */
  async getChatId(userId: string): Promise<string | null> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { telegramChatId: true },
    });

    return settings?.telegramChatId || null;
  }

  /**
   * Link Telegram to existing user (Optional: for future feature)
   */
  async linkTelegramToUser(telegramId: string, chatId: string, userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if Telegram ID already linked
    const existingLink = await this.prisma.userSettings.findFirst({
      where: { telegramUserId: telegramId },
    });

    if (existingLink) {
      throw new ConflictException(
        "Telegram account already linked to another user",
      );
    }

    // Update user settings with Telegram info
    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        telegramChatId: chatId,
        telegramUserId: telegramId,
      },
      update: {
        telegramChatId: chatId,
        telegramUserId: telegramId,
      },
    });

    this.logger.log(`Linked Telegram ${telegramId} to user ${userId}`);
    return true;
  }

  /**
   * Unlink Telegram from user
   */
  async unlinkTelegram(userId: string) {
    await this.prisma.userSettings.update({
      where: { userId },
      data: {
        telegramChatId: null,
        telegramUserId: null,
      },
    });

    this.logger.log(`Unlinked Telegram from user ${userId}`);
    return true;
  }

  /**
   * Get user's preferred language
   */
  async getUserLanguage(telegramId: string): Promise<"vi" | "en"> {
    const user = await this.getUserByTelegramId(telegramId);
    return (user.preferredLanguage as "vi" | "en") || "vi";
  }

  /**
   * Check if Telegram ID is linked to a user
   */
  async isLinked(telegramId: string): Promise<boolean> {
    const settings = await this.prisma.userSettings.findFirst({
      where: { telegramUserId: telegramId },
    });

    return !!settings;
  }
}
