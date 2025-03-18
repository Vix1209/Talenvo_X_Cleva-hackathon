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
    required: false,
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'URL of the resource',
    example: 'https://example.com/intro-to-programming.pdf',
    required: false,
  })
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'Type of the resource (pdf, video, etc.)',
    example: {
      pdf: ResourceType.PDF,
      video: ResourceType.VIDEO,
      link: ResourceType.LINK,
      image: ResourceType.IMAGE,
      audio: ResourceType.AUDIO,
      document: ResourceType.DOCUMENT,
      text: ResourceType.TEXT,
    },
    required: false,
  })
  @IsEnum(ResourceType)
  @IsOptional()
  type?: ResourceType;

  @ApiProperty({
    description: 'Size of the resource in bytes',
    example: 1024,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  size?: number;

  @IsOptional()
  courseId?: string;
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
