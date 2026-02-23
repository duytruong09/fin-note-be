import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ExportRequestDto } from './dto/export-request.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('spending-breakdown')
  getSpendingBreakdown(
    @CurrentUser() user: any,
    @Query() filters: ReportFilterDto,
  ) {
    return this.reportsService.getSpendingBreakdown(user.id, filters);
  }

  @Get('monthly-summary')
  getMonthlySummary(
    @CurrentUser() user: any,
    @Query('year') year: number = new Date().getFullYear(),
  ) {
    return this.reportsService.getMonthlySummary(user.id, year);
  }

  @Get('category-trends')
  getCategoryTrends(
    @CurrentUser() user: any,
    @Query() filters: ReportFilterDto,
  ) {
    return this.reportsService.getCategoryTrends(user.id, filters);
  }

  @Get('daily-summary')
  getDailySummary(@CurrentUser() user: any, @Query() filters: ReportFilterDto) {
    return this.reportsService.getDailySummary(user.id, filters);
  }

  @Post('export')
  exportTransactions(
    @CurrentUser() user: any,
    @Body() exportDto: ExportRequestDto,
  ) {
    return this.reportsService.exportTransactions(user.id, exportDto);
  }
}
