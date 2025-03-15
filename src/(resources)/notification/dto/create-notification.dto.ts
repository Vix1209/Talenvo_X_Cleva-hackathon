import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { NotificationType } from 'utils/types';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'The recipient user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    description: 'The type of notification',
    enum: NotificationType,
    example: NotificationType.SMS,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'The notification title',
    example: 'New Course Available',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The notification content',
    example: 'A new course has been added to your learning path.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The phone number for SMS notifications',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    example: { courseId: '123', courseName: 'Advanced Mathematics' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
