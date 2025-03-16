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
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ResourceType, default: ResourceType.LINK })
  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class UpdateAdditionalResourceDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiProperty()
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  mimeType?: string;
}
