import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  DownloadCourseDto,
  SyncOfflineProgressDto,
  UpdateProgressDto,
} from './dto/course-progress.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Course } from './entities/course.entity';
import { CourseProgress } from './entities/course-progress.entity';
import {
  CreateDownloadableResourceDto,
  UpdateDownloadableResourceDto,
} from './dto/downloadable-resource.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/customDecorators/roles.decorator';

@ApiTags('Courses')
@Controller({ path: 'courses', version: '1' })
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth()
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Roles('teacher')
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course created successfully',
    type: Course,
  })
  async create(@Body() createCourseDto: CreateCourseDto) {
    return await this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all courses',
    type: [Course],
  })
  async findAll() {
    return await this.courseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the course',
    type: Course,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async findOne(@Param('id') id: string) {
    return await this.courseService.findOne(id);
  }

  @Patch(':id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course updated successfully',
    type: Course,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return await this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Course deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.courseService.remove(id);
  }

  // Downloadable Resource Endpoints

  @Post(':courseId/resources')
  @Roles('teacher')
  @ApiOperation({ summary: 'Add a downloadable resource to a course' })
  @ApiResponse({ status: 201, description: 'Resource added successfully' })
  addDownloadableResource(
    @Param('courseId') courseId: string,
    @Body() createDto: CreateDownloadableResourceDto,
  ) {
    return this.courseService.addDownloadableResource({
      ...createDto,
      courseId,
    });
  }

  @Patch('resources/:id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Update a downloadable resource' })
  @ApiResponse({ status: 200, description: 'Resource updated successfully' })
  updateDownloadableResource(
    @Param('id') id: string,
    @Body() updateDto: UpdateDownloadableResourceDto,
  ) {
    return this.courseService.updateDownloadableResource(id, updateDto);
  }

  @Delete('resources/:id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Delete a downloadable resource' })
  @ApiResponse({ status: 200, description: 'Resource deleted successfully' })
  removeDownloadableResource(@Param('id') id: string) {
    return this.courseService.removeDownloadableResource(id);
  }

  // Course Progress and Offline Access Endpoints

  @Post('progress')
  @ApiOperation({ summary: 'Update course progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress updated successfully',
    type: CourseProgress,
  })
  async updateProgress(@Body() updateProgressDto: UpdateProgressDto) {
    return await this.courseService.updateProgress(updateProgressDto);
  }

  @Post('download')
  @ApiOperation({ summary: 'Download a course for offline access' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course downloaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Course not available for offline access',
  })
  async downloadCourse(@Body() downloadCourseDto: DownloadCourseDto) {
    return await this.courseService.downloadCourse(downloadCourseDto);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync offline progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress synced successfully',
    type: CourseProgress,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Progress record not found',
  })
  async syncOfflineProgress(
    @Body() syncOfflineProgressDto: SyncOfflineProgressDto,
  ) {
    return await this.courseService.syncOfflineProgress(syncOfflineProgressDto);
  }

  @Get('progress/user/:userId')
  @ApiOperation({ summary: 'Get all course progress for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns user progress for all courses',
    type: [CourseProgress],
  })
  async getUserCourseProgress(@Param('userId') userId: string) {
    return await this.courseService.getUserCourseProgress(userId);
  }

  @Get('progress/:courseId/user/:userId')
  @ApiOperation({
    summary: 'Get course progress for a specific user and course',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the course progress',
    type: CourseProgress,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Progress not found',
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
}
