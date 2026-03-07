import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FilterBudgetDto } from './dto/filter-budget.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(user.id, createBudgetDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: FilterBudgetDto) {
    return this.budgetsService.findAll(user.id, filters);
  }

  @Get('current/all')
  getCurrentBudgets(@CurrentUser() user: any) {
    return this.budgetsService.getCurrentBudgets(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.budgetsService.findOne(user.id, id);
  }

  @Get(':id/status')
  getBudgetStatus(@CurrentUser() user: any, @Param('id') id: string) {
    return this.budgetsService.getBudgetStatus(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(user.id, id, updateBudgetDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.budgetsService.remove(user.id, id);
  }
}
