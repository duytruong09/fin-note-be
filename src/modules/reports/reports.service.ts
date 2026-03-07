import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ExportRequestDto } from './dto/export-request.dto';
import { Prisma, TransactionType } from '@prisma/client';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get spending breakdown (pie chart data)
   */
  async getSpendingBreakdown(userId: string, filters: ReportFilterDto) {
    const { startDate, endDate, groupBy = 'category' } = filters;

    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      type: TransactionType.EXPENSE,
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    if (groupBy === 'category') {
      // Group by category
      const transactions = await this.prisma.transaction.findMany({
        where,
        include: {
          category: true,
        },
      });

      // Group and sum by category
      const categoryMap = new Map<string, { name: string; amount: number; count: number }>();

      transactions.forEach((t) => {
        const categoryName = t.category?.name || 'Uncategorized';
        const existing = categoryMap.get(categoryName);

        if (existing) {
          existing.amount += Number(t.amount);
          existing.count += 1;
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            amount: Number(t.amount),
            count: 1,
          });
        }
      });

      const totalAmount = Array.from(categoryMap.values()).reduce(
        (sum, item) => sum + item.amount,
        0,
      );

      const byCategory = Array.from(categoryMap.values())
        .map((item) => ({
          ...item,
          percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        data: {
          byCategory,
          total: totalAmount,
          transactionCount: transactions.length,
        },
      };
    } else if (groupBy === 'paymentMethod') {
      // Group by payment method
      const transactions = await this.prisma.transaction.findMany({
        where,
      });

      const paymentMap = new Map<string, { name: string; amount: number; count: number }>();

      transactions.forEach((t) => {
        const paymentName = t.paymentMethod || 'Unknown';
        const existing = paymentMap.get(paymentName);

        if (existing) {
          existing.amount += Number(t.amount);
          existing.count += 1;
        } else {
          paymentMap.set(paymentName, {
            name: paymentName,
            amount: Number(t.amount),
            count: 1,
          });
        }
      });

      const totalAmount = Array.from(paymentMap.values()).reduce(
        (sum, item) => sum + item.amount,
        0,
      );

      const byPaymentMethod = Array.from(paymentMap.values())
        .map((item) => ({
          ...item,
          percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        data: {
          byPaymentMethod,
          total: totalAmount,
          transactionCount: transactions.length,
        },
      };
    }

    return { data: { message: 'Invalid groupBy parameter' } };
  }

  /**
   * Get monthly summary for a year
   */
  async getMonthlySummary(userId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const summary = await Promise.all(
      months.map(async (monthDate: Date) => {
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);

        const where: Prisma.TransactionWhereInput = {
          userId,
          deletedAt: null,
          transactionDate: {
            gte: start,
            lte: end,
          },
        };

        // Get income
        const incomeResult = await this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.INCOME },
          _sum: { amount: true },
          _count: true,
        });

        // Get expense
        const expenseResult = await this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.EXPENSE },
          _sum: { amount: true },
          _count: true,
        });

        const income = Number(incomeResult._sum.amount || 0);
        const expense = Number(expenseResult._sum.amount || 0);
        const balance = income - expense;

        return {
          month: monthDate.getMonth() + 1,
          monthName: format(monthDate, 'MMMM'),
          year: monthDate.getFullYear(),
          income,
          expense,
          balance,
          incomeCount: incomeResult._count,
          expenseCount: expenseResult._count,
        };
      }),
    );

    return { data: summary };
  }

  /**
   * Get category trends over time
   */
  async getCategoryTrends(userId: string, filters: ReportFilterDto) {
    const { startDate, endDate, categoryId } = filters;

    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Group by month and category
    const trendMap = new Map<string, Map<string, { amount: number; count: number }>>();

    transactions.forEach((t) => {
      const monthKey = format(new Date(t.transactionDate), 'yyyy-MM');
      const categoryName = t.category?.name || 'Uncategorized';

      if (!trendMap.has(monthKey)) {
        trendMap.set(monthKey, new Map());
      }

      const monthData = trendMap.get(monthKey)!;
      const existing = monthData.get(categoryName);

      if (existing) {
        existing.amount += Number(t.amount);
        existing.count += 1;
      } else {
        monthData.set(categoryName, {
          amount: Number(t.amount),
          count: 1,
        });
      }
    });

    // Convert to array format
    const trends = Array.from(trendMap.entries()).map(([month, categoryData]) => ({
      month,
      categories: Array.from(categoryData.entries()).map(([name, data]) => ({
        categoryName: name,
        amount: data.amount,
        count: data.count,
      })),
    }));

    return { data: trends };
  }

  /**
   * Get daily summary for calendar heatmap
   */
  async getDailySummary(userId: string, filters: ReportFilterDto) {
    const { startDate, endDate } = filters;

    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      type: TransactionType.EXPENSE,
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Group by day
    const dailyMap = new Map<string, { amount: number; count: number }>();

    transactions.forEach((t) => {
      const dayKey = format(new Date(t.transactionDate), 'yyyy-MM-dd');
      const existing = dailyMap.get(dayKey);

      if (existing) {
        existing.amount += Number(t.amount);
        existing.count += 1;
      } else {
        dailyMap.set(dayKey, {
          amount: Number(t.amount),
          count: 1,
        });
      }
    });

    const dailySummary = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
    }));

    return { data: dailySummary };
  }

  /**
   * Export transactions as CSV
   */
  async exportTransactions(userId: string, exportDto: ExportRequestDto) {
    const { format, startDate, endDate, type } = exportDto;

    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
    };

    if (type) {
      where.type = type as TransactionType;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Payment Method', 'Description', 'Notes'];
      const rows = transactions.map((t) => [
        new Date(t.transactionDate).toISOString().split('T')[0],
        t.type,
        t.category?.name || '',
        t.amount.toString(),
        t.currency,
        t.paymentMethod || '',
        t.description || '',
        t.notes || '',
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

      return {
        data: {
          content: csvContent,
          filename: `transactions_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv',
        },
      };
    } else if (format === 'pdf') {
      // TODO: Implement PDF generation (requires additional library like pdfkit)
      return {
        data: {
          message: 'PDF export not yet implemented',
        },
      };
    }

    return { data: { message: 'Invalid format' } };
  }
}
