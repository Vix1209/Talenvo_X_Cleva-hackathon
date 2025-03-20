import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Twilio } from 'twilio';
import { ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationStatus, NotificationType } from 'utils/types';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../users/entities/user.entity';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private twilioClient: Twilio;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    // Initialize Twilio client
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  private async sendSMS(notification: Notification): Promise<void> {
    try {
      if (!notification.phoneNumber) {
        throw new Error('Phone number is required for SMS notifications');
      }

      const twilioPhoneNumber = this.configService.get<string>(
        'TWILIO_PHONE_NUMBER',
      );

      const message = await this.twilioClient.messages.create({
        body: notification.content,
        from: twilioPhoneNumber,
        to: notification.phoneNumber,
      });

      // Update notification status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      notification.metadata = {
        ...notification.metadata,
        twilioMessageId: message.sid,
        twilioStatus: message.status,
      };

      await this.notificationRepository.save(notification);

      this.logger.log(`SMS sent successfully to ${notification.phoneNumber}`);
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.metadata = {
        ...notification.metadata,
        error: error.message,
      };
      await this.notificationRepository.save(notification);

      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    try {
      const recipient = await this.userRepository.findOne({
        where: { id: notification.recipientId },
        relations: ['role'],
      });

      if (!recipient) {
        throw new Error('Recipient not found for email notification');
      }

      if (!recipient.email) {
        throw new Error('Email address is required for email notifications');
      }

      // We'll use a custom email method for notifications
      // Create a custom notification email using the existing methods in MailService
      await this.mailService.sendCustomNotification(
        recipient.email,
        notification.title,
        notification.content,
        recipient,
        notification.metadata,
      );

      // Update notification status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      notification.metadata = {
        ...notification.metadata,
        emailSentTo: recipient.email,
      };

      await this.notificationRepository.save(notification);

      this.logger.log(
        `Email notification sent successfully to ${recipient.email}`,
      );
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.metadata = {
        ...notification.metadata,
        error: error.message,
      };
      await this.notificationRepository.save(notification);

      this.logger.error(
        `Failed to send email notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const recipient = await this.userRepository.findOne({
      where: { id: createNotificationDto.recipientId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      recipient,
      status: NotificationStatus.PENDING,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Handle different notification types
    switch (notification.type) {
      case NotificationType.SMS:
        await this.sendSMS(savedNotification);
        break;
      case NotificationType.EMAIL:
        await this.sendEmail(savedNotification);
        break;
      case NotificationType.SYSTEM:
        // System notifications don't require immediate action
        // They're just stored in the database for display in the UI
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
        await this.notificationRepository.save(notification);
        break;
      default:
        this.logger.warn(`Unknown notification type: ${notification.type}`);
    }

    return savedNotification;
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId: userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findRead(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId: userId, isRead: true },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async deleteAll(userId: string): Promise<void> {
    await this.notificationRepository.delete({ recipientId: userId });
    this.logger.log(`Deleted all notifications for user ${userId}`);
  }

  async deleteAllRead(userId: string): Promise<void> {
    await this.notificationRepository.delete({
      recipientId: userId,
      isRead: true,
    });
    this.logger.log(`Deleted all read notifications for user ${userId}`);
  }

  async deleteAllUnread(userId: string): Promise<void> {
    await this.notificationRepository.delete({
      recipientId: userId,
      isRead: false,
    });
    this.logger.log(`Deleted all unread notifications for user ${userId}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }
}
