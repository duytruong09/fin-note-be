import {
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  Min,
  Max,
} from "class-validator";

export class CreateBudgetDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsIn(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  alertThreshold?: number;

  @IsOptional()
  isActive?: boolean;
}
