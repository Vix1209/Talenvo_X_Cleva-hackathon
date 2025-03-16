import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import {
  CreateAdditionalResourceDto,
  UpdateAdditionalResourceDto,
} from './dto/additional-resource.dto';
import {
  DownloadCourseDto,
  SyncOfflineProgressDto,
  UpdateProgressDto,
} from './dto/course-progress.dto';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiExcludeController,
} from '@nestjs/swagger';
import { Course } from './entities/course.entity';
import { CourseProgress } from './entities/course-progress.entity';
import {
  CreateDownloadableResourceDto,
  UpdateDownloadableResourceDto,
} from './dto/downloadable-resource.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller({ path: 'courses', version: '1' })
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiTags('Course Management')
  @Roles('teacher')
  @ApiOperation({ summary: 'Create a new course' })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    const user = request.user.id;
    createCourseDto.userId = user;
    return await this.courseService.createCourse(createCourseDto);
  }

  @Get()
  @ApiTags('Course Management')
  @ApiOperation({ summary: 'Get all courses' })
  async findAll() {
    return await this.courseService.findAll();
  }

  @Get(':id')
  @ApiTags('Course Management')
  @ApiOperation({ summary: 'Get a course by ID' })
  async findOne(@Param('id') id: string) {
    return await this.courseService.findOne(id);
  }

  @Patch(':id')
  @Roles('teacher')
  @ApiTags('Course Management')
  @ApiOperation({ summary: 'Update a course' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return await this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles('teacher')
  @ApiTags('Course Management')
  @ApiOperation({ summary: 'Delete a course' })
  async remove(@Param('id') id: string) {
    return await this.courseService.remove(id);
  }

  // Downloadable Resource Endpoints ---------------------------------------------------------------------------------------------------------------------------------------

  @Post(':courseId/resources')
  @Roles('teacher')
  @ApiTags('Courses - Downloadable Resources')
  @ApiOperation({ summary: 'Add a downloadable resource to a course' })
  async addDownloadableResource(
    @Param('courseId') courseId: string,
    @Body() createDto: CreateDownloadableResourceDto,
  ) {
    return await this.courseService.addDownloadableResource({
      ...createDto,
      courseId,
    });
  }

  @Patch('resources/:id')
  @Roles('teacher')
  @ApiTags('Courses - Downloadable Resources')
  @ApiOperation({ summary: 'Update a downloadable resource' })
  async updateDownloadableResource(
    @Param('id') id: string,
    @Body() updateDto: UpdateDownloadableResourceDto,
  ) {
    return await this.courseService.updateDownloadableResource(id, updateDto);
  }

  @Delete('resources/:id')
  @Roles('teacher')
  @ApiTags('Courses - Downloadable Resources')
  @ApiOperation({ summary: 'Delete a downloadable resource' })
  async removeDownloadableResource(@Param('id') id: string) {
    return await this.courseService.removeDownloadableResource(id);
  }

  // Course Progress and Offline Access Endpoints

  @Post('update-progress')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({ summary: 'Update course progress' })
  async updateProgress(@Body() updateProgressDto: UpdateProgressDto) {
    return await this.courseService.updateProgress(updateProgressDto);
  }

  @Post('download')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({ summary: 'Download a course for offline access' })
  async downloadCourse(@Body() downloadCourseDto: DownloadCourseDto) {
    return await this.courseService.downloadCourse(downloadCourseDto);
  }

  @Post('sync-offline-progress')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({ summary: 'Sync offline progress' })
  async syncOfflineProgress(
    @Body() syncOfflineProgressDto: SyncOfflineProgressDto,
  ) {
    return await this.courseService.syncOfflineProgress(syncOfflineProgressDto);
  }

  @Get('course-progress/user/:userId')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({ summary: 'Get all course progress for a user' })
  async getUserCourseProgress(@Param('userId') userId: string) {
    return await this.courseService.getUserCourseProgress(userId);
  }

  @Get('course-progress/:courseId/user/:userId')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({
    summary: 'Get course progress for a specific user and course',
  })
  async getCourseProgressByUserAndCourse(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return await this.courseService.getCourseProgressByUserAndCourse(
      userId,
      courseId,
    );
  }

  // Quiz Endpoints
  @Post(':courseId/quizzes')
  @Roles('teacher')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Create a quiz for a course' })
  async createQuiz(
    @Param('courseId') courseId: string,
    @Body() createQuizDto: CreateQuizDto,
  ) {
    createQuizDto.courseId = courseId;
    return await this.courseService.createQuiz(createQuizDto);
  }

  @Get(':courseId/quizzes')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Get all quizzes for a course' })
  async getQuizzes(@Param('courseId') courseId: string) {
    return await this.courseService.getQuizzes(courseId);
  }

  @Get('quizzes/:quizId')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Get a specific quiz' })
  async getQuiz(@Param('quizId') quizId: string) {
    return await this.courseService.getQuiz(quizId);
  }

  @Patch('quizzes/:quizId')
  @Roles('teacher')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Update a quiz' })
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return await this.courseService.updateQuiz(quizId, updateQuizDto);
  }

  @Delete('quizzes/:quizId')
  @Roles('teacher')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Delete a quiz' })
  async deleteQuiz(@Param('quizId') quizId: string) {
    return await this.courseService.deleteQuiz(quizId);
  }

  // Comment Endpoints
  @Post(':courseId/comments')
  @ApiTags('Courses - Comments')
  @ApiOperation({ summary: 'Create a comment for a course' })
  async createComment(
    @Param('courseId') courseId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    createCommentDto.courseId = courseId;
    return await this.courseService.createComment(
      createCommentDto,
      request.user.id,
    );
  }

  @Get(':courseId/comments')
  @ApiTags('Courses - Comments')
  @ApiOperation({ summary: 'Get all comments for a course' })
  async getComments(@Param('courseId') courseId: string) {
    return await this.courseService.getComments(courseId);
  }

  @Patch('comments/:commentId')
  @ApiTags('Courses - Comments')
  @ApiOperation({ summary: 'Update a comment' })
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    return await this.courseService.updateComment(
      commentId,
      updateCommentDto,
      request.user.id,
    );
  }

  @Delete('comments/:commentId')
  @ApiTags('Courses - Comments')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() request: Request & { user: { id: string } },
  ) {
    return await this.courseService.deleteComment(commentId, request.user.id);
  }

  // Additional Resources Endpoints
  @Post(':courseId/resources')
  @Roles('teacher')
  @ApiTags('Courses - Additional Resources')
  @ApiOperation({ summary: 'Add an additional resource to a course' })
  async createResource(
    @Param('courseId') courseId: string,
    @Body() createResourceDto: CreateAdditionalResourceDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    createResourceDto.courseId = courseId;
    createResourceDto.userId = request.user.id;
    return await this.courseService.createAdditionalResource(createResourceDto);
  }

  @Get(':courseId/resources')
  @ApiTags('Courses - Additional Resources')
  @ApiOperation({ summary: 'Get all additional resources for a course' })
  async getResources(@Param('courseId') courseId: string) {
    return await this.courseService.getAdditionalResources(courseId);
  }

  @Patch('resources/:resourceId')
  @Roles('teacher')
  @ApiTags('Courses - Additional Resources')
  @ApiOperation({ summary: 'Update an additional resource' })
  async updateResource(
    @Param('resourceId') resourceId: string,
    @Body() updateResourceDto: UpdateAdditionalResourceDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    return await this.courseService.updateAdditionalResource(
      resourceId,
      updateResourceDto,
      request.user.id,
    );
  }

  @Delete('resources/:resourceId')
  @Roles('teacher')
  @ApiTags('Courses - Additional Resources')
  @ApiOperation({ summary: 'Delete an additional resource' })
  async deleteResource(
    @Param('resourceId') resourceId: string,
    @Req() request: Request & { user: { id: string } },
  ) {
    return await this.courseService.deleteAdditionalResource(
      resourceId,
      request.user.id,
    );
  }
}
