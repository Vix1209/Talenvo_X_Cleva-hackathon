import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsNumber,
  IsUrl,
} from 'class-validator';

// ------------------ Student Profile DTOs ------------------ //
export class CreateStudentProfileDto {
  @ApiPropertyOptional({
    description: 'Student grade level',
    example: '10th Grade',
  })
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiPropertyOptional({
    description: 'Preferred subjects (comma separated)',
    example: 'Mathematics, Physics, Computer Science',
  })
  @IsOptional()
  @IsString()
  preferredSubjects?: string;

  @ApiPropertyOptional({
    description: 'Learning goals',
    example: 'Improve math skills and prepare for SAT',
  })
  @IsOptional()
  @IsString()
  learningGoals?: string;

  @IsOptional()
  @IsString()
  totalLessonsCompleted?: string;

  @IsOptional()
  @IsString()
  averageQuizScore?: string;

  @ApiPropertyOptional({
    description: 'Badges earned',
    example: 'Math Wizard, Science Explorer, Language Master',
  })
  @IsOptional()
  @IsString()
  badgesEarned?: string;
}

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({
    description: 'Student grade level',
    example: '10th Grade',
  })
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiPropertyOptional({
    description: 'Preferred subjects (comma separated)',
    example: 'Mathematics, Physics, Computer Science',
  })
  @IsOptional()
  @IsString()
  preferredSubjects?: string;

  @ApiPropertyOptional({
    description: 'Learning goals',
    example: 'Improve math skills and prepare for SAT',
  })
  @IsOptional()
  @IsString()
  learningGoals?: string;

  @ApiPropertyOptional({
    description: 'Total lessons completed',
    example: '42',
  })
  @IsOptional()
  @IsString()
  totalLessonsCompleted?: string;

  @ApiPropertyOptional({
    description: 'Average quiz score',
    example: '85%',
  })
  @IsOptional()
  @IsString()
  averageQuizScore?: string;

  @ApiPropertyOptional({
    description: 'Badges earned',
    example: 'Math Wizard, Science Explorer, Language Master',
  })
  @IsOptional()
  @IsString()
  badgesEarned?: string;
}

export class StudentProfileResponseDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  preferredSubjects?: string;

  @IsOptional()
  @IsString()
  learningGoals?: string;

  @IsOptional()
  @IsString()
  totalLessonsCompleted?: string;

  @IsOptional()
  @IsString()
  averageQuizScore?: string;

  @IsOptional()
  @IsString()
  badgesEarned?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ------------------ Teacher Profile DTOs ------------------ //
export class CreateTeacherProfileDto {
  @ApiPropertyOptional({
    description: 'Teacher biography',
    example: 'Experienced math teacher with 10+ years in secondary education',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Subjects taught (comma separated)',
    example: 'Algebra, Calculus, Statistics',
  })
  @IsOptional()
  @IsString()
  subjectsTaught?: string;

  @ApiPropertyOptional({
    description: 'Education level',
    example: 'Masters in Mathematics Education',
  })
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiPropertyOptional({
    description: 'Years of teaching experience',
    example: 8,
  })
  @IsOptional()
  @IsInt()
  teachingExperience?: number;

  @ApiPropertyOptional({
    description: 'Educational certifications (comma separated)',
    example: 'State Teaching License, Advanced Instructional Design',
  })
  @IsOptional()
  @IsString()
  certifications?: string;

  @ApiPropertyOptional({
    description: 'Teacher rating',
    example: '4.8/5.0',
  })
  @IsOptional()
  @IsString()
  rating?: string;

  @ApiPropertyOptional({
    description: 'Total number of courses created',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  totalCourses?: number;
}

export class UpdateTeacherProfileDto {
  @ApiPropertyOptional({
    description: 'Teacher biography',
    example: 'Experienced math teacher with 10+ years in secondary education',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Subjects taught (comma separated)',
    example: 'Algebra, Calculus, Statistics',
  })
  @IsOptional()
  @IsString()
  subjectsTaught?: string;

  @ApiPropertyOptional({
    description: 'Education level',
    example: 'Masters in Mathematics Education',
  })
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiPropertyOptional({
    description: 'Years of teaching experience',
    example: 8,
  })
  @IsOptional()
  @IsInt()
  teachingExperience?: number;

  @ApiPropertyOptional({
    description: 'Educational certifications (comma separated)',
    example: 'State Teaching License, Advanced Instructional Design',
  })
  @IsOptional()
  @IsString()
  certifications?: string;

  @ApiPropertyOptional({
    description: 'Teacher rating',
    example: '4.8/5.0',
  })
  @IsOptional()
  @IsString()
  rating?: string;

  @ApiPropertyOptional({
    description: 'Total number of courses created',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  totalCourses?: number;
}

export class TeacherProfileResponseDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  subjectsTaught?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsInt()
  teachingExperience?: number;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsInt()
  totalCourses?: number;

  createdAt: Date;
  updatedAt: Date;
}

// ------------------ Admin Profile DTOs ------------------ //
export class CreateAdminProfileDto {
  @IsOptional()
  lastLogin?: string;
}

export class UpdateAdminProfileDto {
  @IsOptional()
  lastLogin?: string;
}

export class AdminProfileResponseDto {
  @IsUUID()
  id: string;

  @IsOptional()
  lastLogin?: string;

  createdAt: Date;
  updatedAt: Date;
}
