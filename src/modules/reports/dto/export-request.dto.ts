import { IsIn, IsOptional, IsDateString } from 'class-validator';

export class ExportRequestDto {
  @IsIn(['csv', 'pdf'])
  format: 'csv' | 'pdf';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';
}
