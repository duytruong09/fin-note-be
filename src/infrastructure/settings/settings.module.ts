import { Module, Global } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../database/prisma.module';

@Global() // Make it global so it can be used anywhere
@Module({
  imports: [PrismaModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
