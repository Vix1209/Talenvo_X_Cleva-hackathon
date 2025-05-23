import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class StudentRecommendationDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  watchedCourses: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  interests: string[];
}

export class TeacherRecommendationDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  studentFeedback: string[];
}
