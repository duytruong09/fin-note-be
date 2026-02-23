import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  budgetAlertEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceAutoSubmit?: boolean;

  @IsOptional()
  @IsIn(['vi', 'en'])
  voiceDefaultLang?: 'vi' | 'en';

  @IsOptional()
  @IsIn(['CASH', 'CARD', 'BANK_TRANSFER', 'EWALLET'])
  defaultPaymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'EWALLET';

  @IsOptional()
  @IsString()
  timezone?: string;
}
