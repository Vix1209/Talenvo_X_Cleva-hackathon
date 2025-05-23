import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Title of the course',
    example: 'Course Title',
  })
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
  @IsOptional()
  videoUrl?: string;

  @IsOptional()
  s3VideoUrl?: string;

  @IsOptional()
  cloudfrontUrl?: string;

  @IsOptional()
  videoStreamingUrl?: string;

  @IsOptional()
  videoKey?: string;

  @IsOptional()
  videoThumbnailUrl?: string;

  @ApiProperty({
    description: 'Topics covered in the course',
    example: ['Topic 1', 'Topic 2', 'Topic 3'],
  })
  @IsString({ each: true })
  topics: string[];

  @ApiProperty({
    description: 'Is the course offline accessible',
    example: true,
  })
  @IsString()
  duration: string;

  // @IsOptional()
  // width?: number;

  // @IsOptional()
  // height?: number;

  // @IsOptional()
  // codec?: string;

  @ApiProperty({
    description: 'Category ID of the course',
    example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
