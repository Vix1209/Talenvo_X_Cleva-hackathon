import { Controller, Post, Body } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  StudentRecommendationDto,
  TeacherRecommendationDto,
} from './dto/recommendation.dto';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post('student')
  @ApiOperation({ summary: 'Get course recommendations for a student' })
  async getStudentRecommendations(
    @Body()
    studentRecommendationDto: StudentRecommendationDto,
  ) {
    return this.recommendationService.getStudentRecommendations(
      studentRecommendationDto,
    );
  }

  @Post('teacher')
  @ApiOperation({ summary: 'Get teaching recommendations for a teacher' })
  async getTeacherRecommendations(
    @Body() teacherRecommendationDto: TeacherRecommendationDto,
  ) {
    return this.recommendationService.getTeacherRecommendations(
      teacherRecommendationDto,
    );
  }
}
