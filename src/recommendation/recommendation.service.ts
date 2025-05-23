import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import {
  StudentRecommendationDto,
  TeacherRecommendationDto,
} from './dto/recommendation.dto';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getRecommendationServiceUrl(): string {
    return (
      this.configService.get<string>('RECOMMENDATION_SERVICE_URL') ||
      'http://localhost:8000'
    );
  }

  async getStudentRecommendations(request: StudentRecommendationDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.getRecommendationServiceUrl()}/recommend/student`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      console.error('Error calling recommendation service:', error);
      throw new Error('Failed to get course recommendations');
    }
  }

  async getTeacherRecommendations(request: TeacherRecommendationDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.getRecommendationServiceUrl()}/recommend/teacher`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      console.error('Error calling recommendation service:', error);
      throw new Error('Failed to get teaching recommendations');
    }
  }
}
