import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransactionType, PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new transaction
   */
  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const {
      categoryId,
      amount,
      currency,
      type,
      description,
      transactionDate,
      paymentMethod,
      location,
      notes,
    } = createTransactionDto;

    // Verify category exists and user has access
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

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        categoryId,
        amount,
        currency: currency || 'VND',
        type: type as TransactionType,
        description,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        paymentMethod: paymentMethod as PaymentMethod,
        location,
        notes,
      },
      include: {
        category: true,
      },
    });

    return { data: transaction };
  }

  /**
   * Get all transactions with filters and pagination
   */
  async findAll(userId: string, filters: FilterTransactionDto) {
    const {
      page = 1,
      perPage = 20,
      type,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      isVoiceCreated,
    } = filters;

    const skip = (page - 1) * perPage;

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
    };

    if (type) {
      where.type = type as TransactionType;
    }

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

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isVoiceCreated !== undefined) {
      where.isVoiceCreated = isVoiceCreated === 'true';
    }

    // Get total count
    const total = await this.prisma.transaction.count({ where });

    // Get transactions
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
      skip,
      take: perPage,
    });

    return {
      data: transactions,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get transaction summary (total income, expense, balance)
   */
  async getSummary(userId: string, filters: FilterTransactionDto) {
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

    // Get total income
    const totalIncome = await this.prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.INCOME },
      _sum: { amount: true },
      _count: true,
    });

    // Get total expense
    const totalExpense = await this.prisma.transaction.aggregate({
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
      _count: true,
    });

    const income = totalIncome._sum.amount || 0;
    const expense = totalExpense._sum.amount || 0;
    const balance = Number(income) - Number(expense);

    return {
      data: {
        income: {
          total: income,
          count: totalIncome._count,
        },
        expense: {
          total: expense,
          count: totalExpense._count,
        },
        balance,
      },
    };
  }

  /**
   * Get single transaction
   */
  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (transaction.deletedAt) {
      throw new NotFoundException('Transaction has been deleted');
    }

    return { data: transaction };
  }

  /**
   * Update transaction
   */
  async update(
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (transaction.deletedAt) {
      throw new NotFoundException('Transaction has been deleted');
    }

    // If updating category, verify it exists
    if (updateTransactionDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateTransactionDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (category.userId && category.userId !== userId) {
        throw new ForbiddenException('Cannot use another user\'s category');
      }
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...updateTransactionDto,
        transactionDate: updateTransactionDto.transactionDate
          ? new Date(updateTransactionDto.transactionDate)
          : undefined,
        type: updateTransactionDto.type as TransactionType,
        paymentMethod: updateTransactionDto.paymentMethod as PaymentMethod,
      },
      include: {
        category: true,
      },
    });

    return { data: updated };
  }

  /**
   * Soft delete transaction
   */
  async remove(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (transaction.deletedAt) {
      throw new NotFoundException('Transaction already deleted');
    }

    await this.prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Transaction deleted successfully' };
  }
}
