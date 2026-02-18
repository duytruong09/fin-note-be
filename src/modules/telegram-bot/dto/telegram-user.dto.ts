import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class TelegramUserDto {
  @IsString()
  telegramId: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsString()
  chatId: string;

  @IsOptional()
  @IsBoolean()
  isBot?: boolean;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}

export class LinkAccountDto {
  @IsString()
  linkCode: string;
}
