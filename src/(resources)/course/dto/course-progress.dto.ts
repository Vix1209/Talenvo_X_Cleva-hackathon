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
  @ApiProperty({ description: 'Device platform (e.g., web, ios, android)' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ description: 'Browser or app name' })
  @IsString()
  @IsNotEmpty()
  browser: string;

  @ApiProperty({ description: 'Browser or app version' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: 'Screen resolution' })
  @IsString()
  @IsOptional()
  screenSize?: string;

  @ApiProperty({ description: 'Device model' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ description: 'Operating system' })
  @IsString()
  @IsOptional()
  os?: string;
}

export class UpdateProgressDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiProperty({ description: 'Whether the course is completed' })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiProperty({ description: 'Last position in the course (seconds)' })
  @IsNumber()
  @IsOptional()
  lastPosition?: number;
}

export class DownloadCourseDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Device information',
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
    type: DeviceInfoDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @ApiProperty({ description: 'Last modified timestamp when offline' })
  @IsDate()
  @Type(() => Date)
  lastModifiedOffline: Date;
}
