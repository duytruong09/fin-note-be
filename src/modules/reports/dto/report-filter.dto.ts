import { IsOptional, IsString, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  groupBy?: 'category' | 'paymentMethod' | 'day' | 'week' | 'month';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  @Max(2030)
  year?: number;
}
