import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class VoiceStorageService {
  private readonly logger = new Logger(VoiceStorageService.name);
  private readonly storageType: string;
  private readonly storagePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storageType = this.configService.get<string>('storage.type', 'local');
    this.storagePath = this.configService.get<string>('storage.path', './uploads');

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  /**
   * Store audio file
   */
  async storeAudio(audioFile: Express.Multer.File): Promise<string> {
    try {
      // Validate file size (max 10MB by default)
      const maxSizeMB = this.configService.get<number>('voice.maxAudioFileSizeMB', 10);
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (audioFile.size > maxSizeBytes) {
        throw new BadRequestException(
          `Audio file too large. Max size: ${maxSizeMB}MB`,
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const ext = audioFile.originalname.split('.').pop() || 'm4a';
      const filename = `voice-${timestamp}-${randomStr}.${ext}`;

      if (this.storageType === 'local') {
        return await this.storeLocally(filename, audioFile.buffer);
      } else if (this.storageType === 's3') {
        // TODO: Implement S3 storage
        throw new Error('S3 storage not implemented yet');
      } else {
        throw new Error(`Invalid storage type: ${this.storageType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to store audio:`, error);
      throw error;
    }
  }

  /**
   * Store audio file locally
   */
  private async storeLocally(filename: string, buffer: Buffer): Promise<string> {
    const filePath = join(this.storagePath, filename);

    await writeFile(filePath, buffer);

    this.logger.log(`Audio stored locally: ${filePath}`);

    // Return relative URL (for local development)
    return `/uploads/${filename}`;
  }

  /**
   * Get audio duration (estimate based on file size)
   * For more accurate duration, use ffprobe or similar
   */
  async getAudioDuration(audioFile: Express.Multer.File): Promise<number> {
    // Rough estimate: 1MB ≈ 60 seconds for typical voice recording
    // This is very approximate - for production, use ffprobe
    const estimatedDuration = (audioFile.size / (1024 * 1024)) * 60;

    return Math.round(estimatedDuration * 100) / 100; // Round to 2 decimals
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    if (!existsSync(this.storagePath)) {
      await mkdir(this.storagePath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.storagePath}`);
    }
  }

  /**
   * Delete audio file (for cleanup)
   */
  async deleteAudio(audioUrl: string): Promise<void> {
    if (this.storageType === 'local') {
      const filename = audioUrl.split('/').pop();
      if (!filename) {
        this.logger.warn(`Invalid audio URL: ${audioUrl}`);
        return;
      }
      const filePath = join(this.storagePath, filename);

      try {
        const { unlink } = await import('fs/promises');
        await unlink(filePath);
        this.logger.log(`Deleted audio file: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to delete audio file: ${filePath}`, error);
      }
    }
    // TODO: Implement S3 deletion
  }
}
