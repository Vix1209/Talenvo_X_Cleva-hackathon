import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class QuizQuestionDto {
  @ApiProperty({
    description: 'Question to be asked',
    example: 'What is the capital of Nigeria?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Options for the question',
    example: ['Abuja', 'Lagos', 'Kano', 'Ibadan'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  options: string[];

  @ApiProperty({
    description: 'Correct answer to the question',
    example: 'Abuja',
  })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty({
    description: 'Explanation for the correct answer',
    example: 'Abuja is the capital of Nigeria',
  })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuizDto {
  @ApiProperty({
    description: 'Quiz name',
    example: 'General Knowledge Quiz',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Quiz description',
    example: 'Test your general knowledge with this quiz',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Array of question objects',
    example: [
      {
        question: 'What is the capital of Nigeria?',
        options: ['Abuja', 'Lagos', 'Kano', 'Ibadan'],
        correctAnswer: 'Abuja',
        explanation: 'Abuja is the capital of Nigeria',
      },
      {
        question: 'What is the capital of Ghana?',
        options: ['Accra', 'Kumasi', 'Tamale', 'Takoradi'],
        correctAnswer: 'Accra',
        explanation: 'Accra is the capital of Ghana',
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  assessment: QuizQuestionDto[];

  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Quiz duration in minutes',
    example: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  // @ApiProperty({
  //   description: 'Boolean to determine if quiz is published',
  //   example: true,
  // })
  // @IsOptional()
  // @IsBoolean()
  // isPublished?: boolean;
}

export class UpdateQuizDto {
  @ApiProperty({
    description: 'Quiz name',
    example: 'General Knowledge Quiz',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Quiz description',
    example: 'Test your general knowledge with this quiz',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Quiz questions',
    example: [
      {
        question: 'What is the capital of France?',
        options: ['Paris', 'London', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital of France',
      },
      {
        question: 'What is the largest planet in our solar system?',
        options: ['Jupiter', 'Saturn', 'Mars', 'Earth'],
        correctAnswer: 'Jupiter',
        explanation: 'Jupiter is the largest planet in our solar system',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  assessment?: QuizQuestionDto[];

  @ApiProperty({
    description: 'Course ID to which the quiz belongs',
    example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({
    description: 'Quiz duration in minutes',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  // @ApiProperty({
  //   description: 'Boolean to determine if quiz is published',
  //   example: true,
  // })
  // @IsOptional()
  // @IsBoolean()
  // isPublished?: boolean;
}
