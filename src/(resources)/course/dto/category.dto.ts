import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Programming',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the category',
    example: 'Courses related to programming and software development',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'URL for the category image',
    example: 'https://example.com/images/programming.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the category',
    example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the category',
    example: 'Programming',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the category',
    example: 'Courses related to programming and software development',
  })
  description: string;

  @ApiProperty({
    description: 'URL for the category image',
    example: 'https://example.com/images/programming.jpg',
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Number of courses in this category',
    example: 5,
  })
  courseCount?: number;
}
