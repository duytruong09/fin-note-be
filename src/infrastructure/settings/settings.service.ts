import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private cache: Map<string, string> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get setting value by key
   * Returns null if not found
   */
  async get(key: string): Promise<string | null> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (setting?.value) {
      this.cache.set(key, setting.value);
    }

    return setting?.value || null;
  }

  /**
   * Get setting value by key (throws if not found)
   */
  async getOrThrow(key: string): Promise<string> {
    const value = await this.get(key);
    if (!value) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }
    return value;
  }

  /**
   * Set setting value
   */
  async set(
    key: string,
    value: string,
    options?: {
      description?: string;
      isSecret?: boolean;
      isPublic?: boolean;
    },
  ): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value,
        description: options?.description,
        isSecret: options?.isSecret || false,
        isPublic: options?.isPublic || false,
      },
      update: {
        value,
        description: options?.description,
        isSecret: options?.isSecret,
        isPublic: options?.isPublic,
      },
    });

    // Update cache
    this.cache.set(key, value);
    this.logger.log(`Setting '${key}' updated`);
  }

  /**
   * Delete setting
   */
  async delete(key: string): Promise<void> {
    await this.prisma.setting.delete({
      where: { key },
    });

    this.cache.delete(key);
    this.logger.log(`Setting '${key}' deleted`);
  }

  /**
   * Get all public settings (for mobile app)
   */
  async getPublicSettings(): Promise<Record<string, string>> {
    const settings = await this.prisma.setting.findMany({
      where: { isPublic: true },
      select: { key: true, value: true },
    });

    return settings.reduce(
      (acc, setting) => {
        if (setting.value) {
          acc[setting.key] = setting.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  /**
   * Get all settings (admin only)
   */
  async getAll(includeSecrets = false): Promise<
    Array<{
      key: string;
      value: string | null;
      description: string | null;
      isSecret: boolean;
      isPublic: boolean;
    }>
  > {
    const settings = await this.prisma.setting.findMany({
      where: includeSecrets ? {} : { isSecret: false },
      orderBy: { key: 'asc' },
    });

    return settings.map((s) => ({
      key: s.key,
      value: s.isSecret && !includeSecrets ? '***' : s.value,
      description: s.description,
      isSecret: s.isSecret,
      isPublic: s.isPublic,
    }));
  }

  /**
   * Clear cache (useful after direct DB updates)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Settings cache cleared');
  }

  /**
   * Check if setting exists
   */
  async has(key: string): Promise<boolean> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
      select: { key: true },
    });
    return !!setting;
  }
}
