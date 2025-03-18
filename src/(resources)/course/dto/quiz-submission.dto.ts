import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuizAnswerDto {
  @ApiProperty({
    description: 'Question text',
    example: 'What is the capital of France?',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    description: 'Selected answer',
    example: 'Paris',
  })
  @IsString()
  @IsNotEmpty()
  selectedAnswer: string;
}

export class SubmitQuizDto {
  @ApiProperty({
    description: 'Quiz ID',
    example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
  })
  @IsUUID()
  @IsNotEmpty()
  quizId: string;

  @ApiProperty({
    description: 'Student answers to quiz questions',
    example: [
      {
        questionText: 'What is the capital of France?',
        selectedAnswer: 'Paris',
      },
      {
        questionText: 'What is the largest planet in our solar system?',
        selectedAnswer: 'Jupiter',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];

  @ApiProperty({
    description: 'Time taken to complete the quiz in seconds',
    example: 300,
  })
  @IsNumber()
  @IsOptional()
  timeTaken?: number;
}

export class QuizSubmissionResponseDto {
  @ApiProperty({
    description: 'Quiz submission ID',
    example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
  })
  id: string;

  @ApiProperty({
    description: 'Quiz ID',
    example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
  })
  quizId: string;

  @ApiProperty({
    description: 'Student ID',
    example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
  })
  studentId: string;

  @ApiProperty({
    description: 'Score percentage',
    example: 80.5,
  })
  score: number;

  @ApiProperty({
    description: 'Total number of questions',
    example: 10,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Number of correctly answered questions',
    example: 8,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Time taken to complete the quiz in seconds',
    example: 300,
  })
  timeTaken?: number;

  @ApiProperty({
    description: 'Quiz submission date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}
