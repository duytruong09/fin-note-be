import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterBudgetDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
