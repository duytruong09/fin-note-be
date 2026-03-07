import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Available theme colors
  private readonly THEME_COLORS = [
    'red',
    'pink',
    'purple',
    'blue',
    'cyan',
    'teal',
    'green',
    'lime',
    'yellow',
    'orange',
    'indigo',
    'violet',
    'fuchsia',
    'rose',
    'sky',
    'emerald',
    'amber',
    'slate',
    'gray',
    'neutral',
  ];

  /**
   * Get user settings (create default if not exists)
   */
  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          theme: 'blue',
          notificationEnabled: true,
          budgetAlertEnabled: true,
          voiceAutoSubmit: false,
          voiceDefaultLang: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
    }

    return { data: settings };
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, updateDto: UpdateUserSettingsDto) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...updateDto,
        defaultPaymentMethod: updateDto.defaultPaymentMethod as PaymentMethod,
      },
      create: {
        userId,
        theme: updateDto.theme || 'blue',
        notificationEnabled: updateDto.notificationEnabled ?? true,
        budgetAlertEnabled: updateDto.budgetAlertEnabled ?? true,
        voiceAutoSubmit: updateDto.voiceAutoSubmit ?? false,
        voiceDefaultLang: updateDto.voiceDefaultLang || 'vi',
        defaultPaymentMethod: updateDto.defaultPaymentMethod as PaymentMethod,
        timezone: updateDto.timezone || 'Asia/Ho_Chi_Minh',
      },
    });

    return { data: settings };
  }

  /**
   * Get available theme colors
   */
  async getThemes() {
    return {
      data: {
        themes: this.THEME_COLORS,
        default: 'blue',
      },
    };
  }
}
