import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await this.$connect();
        console.log('✅ Database connected');
        return;
      } catch (error) {
        retries++;
        console.error(`❌ Database connection attempt ${retries}/${maxRetries} failed:`, error.message);

        if (retries >= maxRetries) {
          console.error('❌ Max database connection retries reached.');
          console.error('⚠️  App will start without database. Please check DATABASE_URL configuration.');
          console.error('💡 Tip: For Render with Supabase, use port 6543 with pgbouncer=true');

          // Don't throw - allow app to start even without DB
          // This allows Render to detect the port and health checks to work
          return;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Helper method to enable soft delete filtering
   */
  async enableSoftDelete() {
    this.$use(async (params, next) => {
      if (params.model === 'Transaction') {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, deletedAt: null };
        }
        if (params.action === 'findMany') {
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where.deletedAt = null;
            }
          } else {
            params.args.where = { deletedAt: null };
          }
        }
      }
      return next(params);
    });
  }
}
