import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DeviceInfoDto {
  @ApiProperty({
    description: 'Device platform (e.g., web, ios, android)',
    example: 'web',
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({
    description: 'Browser or app name',
    example: 'Chrome',
  })
  @IsString()
  @IsNotEmpty()
  browser: string;

  @ApiProperty({
    description: 'Browser or app version',
    example: '90.0.4430.93',
  })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({
    description: 'Screen resolution',
    example: '1920x1080',
  })
  @IsString()
  @IsOptional()
  screenSize?: string;

  @ApiProperty({
    description: 'Device model',
    example: 'MacBook Pro',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({
    description: 'Operating system',
    example: 'Mac OS',
  })
  @IsString()
  @IsOptional()
  os?: string;
}

export class UpdateProgressDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiProperty({
    description: 'Whether the course is completed',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiProperty({
    description: 'Last position in the course (seconds)',
    example: 3600,
  })
  @IsNumber()
  @IsOptional()
  lastPosition?: number;
}

export class DownloadCourseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Device information',
    example: 'iPhone 13',
    type: DeviceInfoDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;
}

export class SyncOfflineProgressDto extends UpdateProgressDto {
  @ApiProperty({
    description: 'Device information',
    example: 'iPhone 13',
    type: DeviceInfoDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @ApiProperty({
    description: 'Last modified timestamp when offline',
    example: 1643723400,
  })
  @IsDate()
  @Type(() => Date)
  lastModifiedOffline: Date;
}

export class CourseStorageInfoDto {
  @ApiProperty({
    description: 'Estimated size of the course in bytes',
    example: 1024000,
  })
  estimatedSize: number;

  @ApiProperty({
    description: 'Human-readable formatted size of the course',
    example: '1.00 MB',
  })
  estimatedSizeFormatted: string;

  @ApiProperty({
    description: 'Total storage used by the user in bytes',
    example: 5120000,
  })
  totalStorageUsed: number;

  @ApiProperty({
    description: 'Maximum storage allowed for the user in bytes',
    example: 104857600,
  })
  maxStorageAllowed: number;

  @ApiProperty({
    description: 'Whether the user has enough storage to download the course',
    example: true,
  })
  hasEnoughStorage: boolean;
}
