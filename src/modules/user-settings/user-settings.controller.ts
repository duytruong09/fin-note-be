import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('user-settings')
@UseGuards(JwtAuthGuard)
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: any) {
    return this.userSettingsService.getSettings(user.id);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateUserSettingsDto,
  ) {
    return this.userSettingsService.updateSettings(user.id, updateDto);
  }

  @Get('themes')
  getThemes() {
    return this.userSettingsService.getThemes();
  }
}
