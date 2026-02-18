import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { VoiceService } from '@/modules/voice/voice.service';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

@Injectable()
export class TelegramVoiceService {
  private readonly logger = new Logger(TelegramVoiceService.name);
  private readonly tempDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly voiceService: VoiceService,
  ) {
    this.tempDir = path.join(process.cwd(), 'temp', 'telegram-audio');
    this.ensureTempDir();
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      this.logger.log(`Created temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Download voice file from Telegram
   */
  async downloadVoiceFile(bot: Telegraf, fileId: string): Promise<string> {
    try {
      // Get file URL from Telegram
      const fileLink = await bot.telegram.getFileLink(fileId);
      const fileUrl = fileLink.href;

      // Generate unique filename
      const fileName = `${Date.now()}-${fileId}.oga`;
      const filePath = path.join(this.tempDir, fileName);

      // Download file
      await this.downloadFile(fileUrl, filePath);

      this.logger.log(`Downloaded voice file: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error('Failed to download voice file', error);
      throw new BadRequestException('Failed to download voice file');
    }
  }

  /**
   * Download file from URL
   */
  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      const protocol = url.startsWith('https') ? https : http;

      protocol
        .get(url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        })
        .on('error', (err) => {
          fs.unlinkSync(dest);
          reject(err);
        });
    });
  }

  /**
   * Convert OGA (Opus) to WAV format
   * Telegram voice messages are in OGA format, but Whisper needs WAV/M4A
   */
  async convertOgaToWav(ogaPath: string): Promise<string> {
    try {
      const wavPath = ogaPath.replace('.oga', '.wav');

      // Use ffmpeg to convert
      const ffmpegPath = require('ffmpeg-static');
      const command = `"${ffmpegPath}" -i "${ogaPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}"`;

      await execPromise(command);

      this.logger.log(`Converted OGA to WAV: ${wavPath}`);
      return wavPath;
    } catch (error) {
      this.logger.error('Failed to convert audio format', error);
      throw new BadRequestException('Failed to convert audio format');
    }
  }

  /**
   * Process Telegram voice message
   */
  async processVoiceMessage(
    bot: Telegraf,
    userId: string,
    fileId: string,
    language: 'vi' | 'en',
  ) {
    let ogaPath: string | null = null;
    let wavPath: string | null = null;

    try {
      // 1. Download OGA file from Telegram
      ogaPath = await this.downloadVoiceFile(bot, fileId);

      // 2. Convert OGA to WAV
      wavPath = await this.convertOgaToWav(ogaPath);

      // 3. Create Express.Multer.File compatible object
      const audioFile = await this.createMulterFile(wavPath);

      // 4. Process with existing VoiceService
      const result = await this.voiceService.processVoiceInput(
        userId,
        language,
        audioFile,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to process voice message', error);
      throw error;
    } finally {
      // Cleanup temp files
      if (ogaPath && fs.existsSync(ogaPath)) {
        fs.unlinkSync(ogaPath);
      }
      if (wavPath && fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }
    }
  }

  /**
   * Create Express.Multer.File compatible object from file path
   */
  private async createMulterFile(filePath: string): Promise<Express.Multer.File> {
    const buffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    return {
      fieldname: 'audio',
      originalname: fileName,
      encoding: '7bit',
      mimetype: 'audio/wav',
      buffer: buffer,
      size: stats.size,
      destination: this.tempDir,
      filename: fileName,
      path: filePath,
      stream: fs.createReadStream(filePath),
    } as Express.Multer.File;
  }

  /**
   * Process text message (without voice)
   */
  async processTextMessage(userId: string, text: string, language: 'vi' | 'en') {
    try {
      return await this.voiceService.testParsing(userId, text, language);
    } catch (error) {
      this.logger.error('Failed to process text message', error);
      throw error;
    }
  }
}
