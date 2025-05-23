import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { JwtGuard } from '../auth/guard/jwt.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiExcludeController()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create a new notification' })
  // async create(
  //   @Body() createNotificationDto: CreateNotificationDto,
  // ): Promise<Notification> {
  //   return await this.notificationService.create(createNotificationDto);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  async findAll(@Request() req): Promise<Notification[]> {
    return await this.notificationService.findAll(req.user.id);
  }

  @Get('unread')
  @ApiOperation({
    summary: 'Get all unread notifications for the authenticated user',
  })
  async findUnread(@Request() req): Promise<Notification[]> {
    return await this.notificationService.findUnread(req.user.id);
  }

  @Get('read')
  @ApiOperation({
    summary: 'Get all read notifications for the authenticated user',
  })
  async findRead(@Request() req): Promise<Notification[]> {
    return await this.notificationService.findRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req,
  ): Promise<Notification> {
    return await this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req): Promise<void> {
    return await this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Delete all notifications' })
  async deleteAll(@Request() req): Promise<void> {
    return await this.notificationService.deleteAll(req.user.id);
  }

  @Delete('read-notifications')
  @ApiOperation({ summary: 'Delete all read notifications' })
  async deleteAllRead(@Request() req): Promise<void> {
    return await this.notificationService.deleteAllRead(req.user.id);
  }

  @Delete('unread-notifications')
  @ApiOperation({ summary: 'Delete all unread notifications' })
  async deleteAllUnread(@Request() req): Promise<void> {
    return await this.notificationService.deleteAllUnread(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return await this.notificationService.delete(id, req.user.id);
  }
}
