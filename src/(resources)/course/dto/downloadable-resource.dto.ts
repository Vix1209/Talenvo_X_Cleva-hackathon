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
  @ApiProperty({ description: 'Name of the resource' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL of the resource' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Type of the resource (pdf, video, etc.)' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({
    description: 'Size of the resource in bytes',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiProperty({ description: 'Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}

export class UpdateDownloadableResourceDto {
  @ApiProperty({ description: 'Name of the resource', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'URL of the resource', required: false })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'Type of the resource (pdf, video, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Size of the resource in bytes',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  size?: number;
}
