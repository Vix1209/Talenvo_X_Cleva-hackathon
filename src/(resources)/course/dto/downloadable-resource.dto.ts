import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ResourceType } from 'utils/types';

export class CreateDownloadableResourceDto {
  @ApiProperty({
    description: 'Name of the resource',
    example: 'Introduction to Programming',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'URL of the resource',
    example: 'https://example.com/intro-to-programming.pdf',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Type of the resource (pdf, video, etc.)',
    example: 'pdf',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({
    description: 'Size of the resource in bytes',
    example: 1024,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}

export class UpdateDownloadableResourceDto {
  @ApiProperty({
    description: 'Name of the resource',
    example: 'Introduction to Programming',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'URL of the resource',
    example: 'https://example.com/intro-to-programming.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'Type of the resource (pdf, video, etc.)',
    example: 'pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Size of the resource in bytes',
    example: 1024,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  size?: number;
}
