import {
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  IsDateString,
  Min,
} from "class-validator";

export class CreateTransactionDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsIn(["INCOME", "EXPENSE"])
  type: "INCOME" | "EXPENSE";

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsIn(["CASH", "CARD", "BANK_TRANSFER", "EWALLET"])
  paymentMethod?: "CASH" | "CARD" | "BANK_TRANSFER" | "EWALLET";

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
