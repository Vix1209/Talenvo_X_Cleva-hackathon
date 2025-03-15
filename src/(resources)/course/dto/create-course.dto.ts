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

  @IsUUID()
  @IsOptional()
  userId?: string;
}
