import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class QuizQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  options: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuizDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  assessment: QuizQuestionDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateQuizDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  assessment?: QuizQuestionDto[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
