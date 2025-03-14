import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

  @ApiProperty({ description: 'Last position in the course' })
  @IsObject()
  @IsOptional()
  lastPosition?: {
    section: string;
    timestamp: number;
    completedResources: string[];
  };
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

  @ApiProperty({ description: 'Device information' })
  @IsString()
  @IsNotEmpty()
  deviceInfo: string;
}

export class SyncOfflineProgressDto {
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

  @ApiProperty({ description: 'Last position in the course' })
  @IsObject()
  @IsOptional()
  lastPosition?: {
    section: string;
    timestamp: number;
    completedResources: string[];
  };

  @ApiProperty({ description: 'Device information' })
  @IsString()
  @IsNotEmpty()
  deviceInfo: string;

  @ApiProperty({
    description: 'Timestamp when the data was last modified offline',
  })
  @IsString()
  @IsNotEmpty()
  lastModifiedOffline: string;
}
