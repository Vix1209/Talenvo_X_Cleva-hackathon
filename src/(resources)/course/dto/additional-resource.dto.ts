import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ResourceType } from 'utils/types';

export class CreateAdditionalResourceDto {
  @ApiProperty({
    description: 'The title of the resource',
    example: 'Resource Title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The description of the resource',
    example: 'This is a description of the resource',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ResourceType, default: ResourceType.LINK })
  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;

  @ApiProperty({
    description: 'The URL of the resource',
    example: 'https://example.com/resource.pdf',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'The size of the file in bytes',
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiProperty({
    description: 'The MIME type of the file',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class UpdateAdditionalResourceDto {
  @ApiProperty({
    description: 'The title of the resource',
    example: 'Resource Title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'The description of the resource',
    example: 'This is a description of the resource',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ResourceType, default: ResourceType.LINK })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiProperty({
    description: 'The URL of the resource',
    example: 'https://example.com/resource.pdf',
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({
    description: 'The size of the file in bytes',
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiProperty({
    description: 'The MIME type of the file',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
