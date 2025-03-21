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
  UnauthorizedException,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
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
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Course } from './entities/course.entity';
import { CourseProgress } from './entities/course-progress.entity';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubmitQuizDto } from './dto/quiz-submission.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto/category.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const uploadPath = path.join(process.cwd(), 'temp-uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

@Controller({ path: 'courses', version: '1' })
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // Category Endpoints ---------------------------------------------------------------------

  @Post('categories')
  @Roles('teacher', 'admin')
  @ApiTags('Course Categories')
  @ApiOperation({ summary: 'Create a new course category' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.courseService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiTags('Course Categories')
  @ApiOperation({ summary: 'Get all course categories' })
  async findAllCategories(): Promise<CategoryResponseDto[]> {
    return await this.courseService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiTags('Course Categories')
  @ApiOperation({ summary: 'Get a category by ID' })
  async findOneCategory(@Param('id') id: string): Promise<CategoryResponseDto> {
    return await this.courseService.findOneCategory(id);
  }

  @Patch('categories/:id')
  @Roles('teacher', 'admin')
  @ApiTags('Course Categories')
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.courseService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @Roles('teacher', 'admin')
  @ApiTags('Course Categories')
  @ApiOperation({ summary: 'Delete a category' })
  async removeCategory(@Param('id') id: string) {
    await this.courseService.removeCategory(id);
    return { message: 'Category deleted successfully' };
  }

  @Get('by-category/:categoryId')
  @ApiTags('Course Categories')
  @ApiOperation({ summary: 'Get courses by category' })
  async getCoursesByCategory(@Param('categoryId') categoryId: string) {
    return await this.courseService.getCoursesByCategory(categoryId);
  }

  // Course Endpoints ---------------------------------------------------------------------

  @Post()
  @ApiTags('Course Management')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Create a new course' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: {
        fileSize: 1024 * 1024 * 500,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'video/webm',
          'video/x-matroska',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Invalid file type. Only video files are allowed.',
            ),
            false,
          );
          return;
        }

        cb(null, true);
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description:
            'Course video file (mp4, mov, avi, webm, mkv). Maximum size: 5GB',
          example: 'video.mp4',
        },
        title: {
          type: 'string',
          description: 'Title of the course',
          example: 'Introduction to Programming',
        },
        description: {
          type: 'string',
          description: 'Description of the course',
          example:
            'Learn the basics of programming with this comprehensive course.',
        },
        topics: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Topics covered in the course',
          example: ['Programming Basics', 'Variables', 'Control Structures'],
        },
        duration: {
          type: 'string',
          description: 'Duration of the course',
          example: '100',
        },
        categoryId: {
          type: 'string',
          description: 'Category ID of the course',
          example: 'f3d7b7a3-7b3e-4c3b-8d0b-6b9e6f2b3b3a',
        },
      },
      required: ['title', 'description', 'categoryId', 'video'],
    },
  })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() video: Express.Multer.File,
    @Req() request: Request & { user: { id: string } },
  ) {
    const userId = request.user.id;
    return await this.courseService.createCourse(
      createCourseDto,
      video,
      userId,
    );
  }

  @Get()
  @ApiTags('Course Management')
  @ApiOperation({
    summary: 'Get all courses with filtering, sorting, and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search courses by title or description',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter courses by category ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Field to sort by (title, createdAt, updatedAt, downloadCount)',
    enum: ['title', 'createdAt', 'updatedAt', 'downloadCount'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
  })
  async findAll(@Query() queryOptions: QueryCourseDto) {
    return await this.courseService.findAll(queryOptions);
  }

  @Get(':id')
  @ApiTags('Course Management')
  @ApiOperation({ summary: 'Get a course by ID' })
  async findOne(@Param('id') id: string) {
    return await this.courseService.findOne(id);
  }

  @Patch(':id')
  @Roles('teacher', 'admin')
  @ApiTags('Course Management')
  @ApiOperation({ summary: 'Update a course' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return await this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles('teacher', 'admin')
  @ApiTags('Course Management')
  @ApiOperation({ summary: 'Delete a course' })
  async remove(@Param('id') id: string) {
    return await this.courseService.remove(id);
  }

  // Downloadable Resource Endpoints ---------------------------------------------------------------------------------------------------------------------------------------

  @Post(':courseId/toggle-download-state')
  @Roles('teacher', 'admin')
  @ApiTags('Courses - Downloadable Resources')
  @ApiOperation({ summary: 'Make course downloadable or not' })
  async toggleCourseDownloadStatus(@Param('courseId') courseId: string) {
    const data = await this.courseService.toggleCourseDownloadStatus(courseId);
    return {
      data,
      status: 'success',
    };
  }

  // Course Progress and Offline Access Endpoints

  @Post('update-progress')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiQuery({
    name: 'courseId',
    required: true,
    type: String,
    description: 'The ID of the course',
  })
  @ApiOperation({
    summary:
      'Update course progress while the student is taking the course online',
  })
  async updateProgress(
    @Body() updateProgressDto: UpdateProgressDto,
    @Req() request: Request & { user: { id: string } },
    @Param('courseId') courseId: string,
  ) {
    const userId = request.user.id;
    updateProgressDto.userId = userId;
    updateProgressDto.courseId = courseId;
    return await this.courseService.updateProgress(updateProgressDto);
  }

  @Post('download')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({
    summary: 'Download a course for offline access',
    description:
      'Downloads a course for offline access. The client can provide storage information to validate if there is enough space available for the download.',
  })
  async downloadCourse(
    @Body() downloadCourseDto: DownloadCourseDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    const userId = request.user.id;
    downloadCourseDto.userId = userId;
    return await this.courseService.downloadCourse(downloadCourseDto);
  }

  @Get('estimate-size/:courseId')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({
    summary: 'Estimate the size of a course for storage planning',
  })
  @ApiQuery({
    name: 'totalStorageUsed',
    required: false,
    type: Number,
    description: 'Current total storage used by the client in bytes',
  })
  @ApiQuery({
    name: 'maxStorageAllowed',
    required: false,
    type: Number,
    description: 'Maximum storage allowed for the client in bytes',
  })
  async estimateCourseSize(
    @Param('courseId') courseId: string,
    @Query('totalStorageUsed') totalStorageUsed?: number,
    @Query('maxStorageAllowed') maxStorageAllowed?: number,
  ) {
    const storageInfo = await this.courseService.estimateCourseSize(courseId);

    // Update with client-provided storage information if available
    if (totalStorageUsed !== undefined) {
      storageInfo.totalStorageUsed = Number(totalStorageUsed);
    }

    if (maxStorageAllowed !== undefined) {
      storageInfo.maxStorageAllowed = Number(maxStorageAllowed);
    }

    // Determine if enough storage is available
    if (storageInfo.totalStorageUsed > 0 && storageInfo.maxStorageAllowed > 0) {
      storageInfo.hasEnoughStorage =
        storageInfo.totalStorageUsed + storageInfo.estimatedSize <=
        storageInfo.maxStorageAllowed;
    }

    return storageInfo;
  }

  @Post('sync-offline-progress')
  @ApiTags('Courses - Course Progress and Offline Access')
  @ApiOperation({
    summary:
      'Sync offline progress when the student is watching a video offline and then comes back online',
  })
  async syncOfflineProgress(
    @Param('courseId') courseId: string,
    @Req() request: Request & { user: { id: string } },
    @Body() syncOfflineProgressDto: SyncOfflineProgressDto,
  ) {
    syncOfflineProgressDto.courseId = courseId;
    syncOfflineProgressDto.userId = request.user.id;
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
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
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
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Delete a quiz' })
  async deleteQuiz(@Param('quizId') quizId: string) {
    return await this.courseService.deleteQuiz(quizId);
  }

  // Quiz Submission Endpoints
  @Post('quizzes/submit')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('student', 'admin')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Submit a quiz answer' })
  async submitQuiz(
    @Body() submitQuizDto: SubmitQuizDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return await this.courseService.submitQuiz(submitQuizDto, req.user.id);
  }

  @Get('student/quiz-submissions')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('student', 'admin')
  @ApiTags('Courses - Quizzes')
  @ApiOperation({
    summary: 'Get all quiz submissions for the logged-in student',
  })
  async getMyQuizSubmissions(@Req() req: Request & { user: { id: string } }) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return await this.courseService.getStudentQuizSubmissions(req.user.id);
  }

  @Get('quiz-submissions/:submissionId')
  @UseGuards(JwtGuard)
  @ApiTags('Courses - Quizzes')
  @ApiOperation({ summary: 'Get a specific quiz submission' })
  async getQuizSubmission(@Param('submissionId') submissionId: string) {
    return await this.courseService.getQuizSubmission(submissionId);
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
  @Post(':courseId/additional-resources')
  @Roles('teacher', 'admin')
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

  @Get(':courseId/additional-resources')
  @ApiTags('Courses - Additional Resources')
  @ApiOperation({ summary: 'Get all additional resources for a course' })
  async getResources(@Param('courseId') courseId: string) {
    return await this.courseService.getAdditionalResources(courseId);
  }

  @Patch('additional-resources/:resourceId')
  @Roles('teacher', 'admin')
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

  @Delete('additional-resources/:resourceId')
  @Roles('teacher', 'admin')
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
