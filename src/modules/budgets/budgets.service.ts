import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FilterBudgetDto } from './dto/filter-budget.dto';
import { BudgetPeriod, Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new budget
   */
  async create(userId: string, createBudgetDto: CreateBudgetDto) {
    const {
      categoryId,
      amount,
      currency,
      period,
      startDate,
      endDate,
      alertThreshold,
      isActive,
    } = createBudgetDto;

    // Verify category exists and user has access (if categoryId provided)
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Check if user can use this category (system or own)
      if (category.userId && category.userId !== userId) {
        throw new ForbiddenException('Cannot use another user\'s category');
      }
    }

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId,
        amount,
        currency: currency || 'VND',
        period: period as BudgetPeriod,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        alertThreshold: alertThreshold ?? 0.8,
        isActive: isActive ?? true,
      },
      include: {
        category: true,
      },
    });

    return { data: budget };
  }

  /**
   * Get all budgets with filters
   */
  async findAll(userId: string, filters: FilterBudgetDto) {
    const { categoryId, period, isActive } = filters;

    const where: Prisma.BudgetWhereInput = {
      userId,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (period) {
      where.period = period as BudgetPeriod;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { data: budgets };
  }

  /**
   * Get single budget
   */
  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return { data: budget };
  }

  /**
   * Get budget status with spending calculations
   */
  async getBudgetStatus(userId: string, budgetId: string) {
    // Get budget
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Build where clause for transactions
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      type: TransactionType.EXPENSE,
      transactionDate: {
        gte: budget.startDate,
        lte: budget.endDate,
      },
    };

    // If budget is for specific category, filter by it
    if (budget.categoryId) {
      where.categoryId = budget.categoryId;
    }

    // Get transactions and calculate total spent
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    const totalSpent = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const budgetAmount = Number(budget.amount);
    const remaining = budgetAmount - totalSpent;
    const percentageUsed = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
    const isExceeded = totalSpent > budgetAmount;
    const shouldAlert = percentageUsed >= Number(budget.alertThreshold) * 100;

    return {
      data: {
        budget,
        spent: totalSpent,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100, // Round to 2 decimals
        isExceeded,
        shouldAlert,
        transactionCount: transactions.length,
        transactions,
      },
    };
  }

  /**
   * Get current period budgets with status
   */
  async getCurrentBudgets(userId: string) {
    const now = new Date();

    // Get all active budgets that include current date
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get status for each budget
    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const statusResult = await this.getBudgetStatus(userId, budget.id);
        return statusResult.data;
      }),
    );

    return { data: budgetsWithStatus };
  }

  /**
   * Update budget
   */
  async update(userId: string, id: string, updateBudgetDto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // If updating category, verify it exists
    if (updateBudgetDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateBudgetDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (category.userId && category.userId !== userId) {
        throw new ForbiddenException('Cannot use another user\'s category');
      }
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        ...updateBudgetDto,
        startDate: updateBudgetDto.startDate
          ? new Date(updateBudgetDto.startDate)
          : undefined,
        endDate: updateBudgetDto.endDate
          ? new Date(updateBudgetDto.endDate)
          : undefined,
        period: updateBudgetDto.period as BudgetPeriod,
      },
      include: {
        category: true,
      },
    });

    return { data: updated };
  }

  /**
   * Delete budget (hard delete - budgets are not critical data)
   */
  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.budget.delete({
      where: { id },
    });

    return { message: 'Budget deleted successfully' };
  }
}
