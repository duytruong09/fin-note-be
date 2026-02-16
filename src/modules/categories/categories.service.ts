import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all categories (system + user's custom categories)
   */
  async findAll(userId: string, type?: 'INCOME' | 'EXPENSE') {
    const where: any = {
      OR: [{ userId: null }, { userId }], // System categories or user's categories
    };

    if (type) {
      where.type = type as TransactionType;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return {
      data: categories,
      meta: {
        total: categories.length,
        systemCount: categories.filter((c) => c.isSystem).length,
        customCount: categories.filter((c) => !c.isSystem).length,
      },
    };
  }

  /**
   * Get only system categories
   */
  async findSystemCategories(type?: 'INCOME' | 'EXPENSE') {
    const where: any = { isSystem: true };

    if (type) {
      where.type = type as TransactionType;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      data: categories,
      meta: {
        total: categories.length,
      },
    };
  }

  /**
   * Create custom category
   */
  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const { name, type, icon, color, parentCategoryId } = createCategoryDto;

    // Check if category name already exists for this user
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name,
      },
    });

    if (existing) {
      throw new BadRequestException('Category name already exists');
    }

    // If parent category specified, verify it exists
    if (parentCategoryId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentCategoryId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Verify parent belongs to user or is system category
      if (parent.userId && parent.userId !== userId) {
        throw new ForbiddenException('Cannot use another user\'s category as parent');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        userId,
        name,
        type: type as TransactionType,
        icon,
        color,
        parentCategoryId,
        isSystem: false,
      },
    });

    return { data: category };
  }

  /**
   * Get category by ID
   */
  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parentCategory: true,
        subcategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if user has access (system category or own category)
    if (category.userId && category.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return { data: category };
  }

  /**
   * Update custom category
   */
  async update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Cannot update system categories
    if (category.isSystem) {
      throw new ForbiddenException('Cannot update system categories');
    }

    // Check ownership
    if (category.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    return { data: updated };
  }

  /**
   * Delete custom category
   */
  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Cannot delete system categories
    if (category.isSystem) {
      throw new ForbiddenException('Cannot delete system categories');
    }

    // Check ownership
    if (category.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if category has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${transactionCount} transactions. Please reassign them first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
