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
  @ApiProperty({ description: 'Title of the course', example: 'Course Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Description of the course',
    example: 'Course Description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'URL of the course video',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @ApiProperty({
    description: 'Topics covered in the course',
    example: ['Topic 1', 'Topic 2', 'Topic 3'],
  })
  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @ApiProperty({ description: 'Duration of the course', example: '100' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
