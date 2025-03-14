import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ description: 'Title of the course' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of the course' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'URL of the course video' })
  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @ApiProperty({ description: 'Topics covered in the course' })
  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @ApiProperty({ description: 'Duration of the course' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({ description: 'User ID of the course creator' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Whether the course is available for offline access',
    example: 'true',
  })
  @IsBoolean()
  @IsOptional()
  isOfflineAccessible?: boolean;
}
