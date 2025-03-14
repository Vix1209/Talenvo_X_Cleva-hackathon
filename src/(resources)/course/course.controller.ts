import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
  async create(@Body() createCourseDto: CreateCourseDto) {
    return await this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  async findAll() {
    return await this.courseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  async findOne(@Param('id') id: string) {
    return await this.courseService.findOne(id);
  }

  @Patch(':id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Update a course' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return await this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Delete a course' })
  async remove(@Param('id') id: string) {
    return await this.courseService.remove(id);
  }

  // Downloadable Resource Endpoints ---------------------------------------------------------------------------------------------------------------------------------------

  @Post(':courseId/resources')
  @Roles('teacher')
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
  @ApiOperation({ summary: 'Update a downloadable resource' })
  async updateDownloadableResource(
    @Param('id') id: string,
    @Body() updateDto: UpdateDownloadableResourceDto,
  ) {
    return await this.courseService.updateDownloadableResource(id, updateDto);
  }

  @Delete('resources/:id')
  @Roles('teacher')
  @ApiOperation({ summary: 'Delete a downloadable resource' })
  async removeDownloadableResource(@Param('id') id: string) {
    return await this.courseService.removeDownloadableResource(id);
  }

  // Course Progress and Offline Access Endpoints

  @Post('update-progress')
  @ApiOperation({ summary: 'Update course progress' })
  async updateProgress(@Body() updateProgressDto: UpdateProgressDto) {
    return await this.courseService.updateProgress(updateProgressDto);
  }

  @Post('download')
  @ApiOperation({ summary: 'Download a course for offline access' })
  async downloadCourse(@Body() downloadCourseDto: DownloadCourseDto) {
    return await this.courseService.downloadCourse(downloadCourseDto);
  }

  @Post('sync-offline-progress')
  @ApiOperation({ summary: 'Sync offline progress' })
  async syncOfflineProgress(
    @Body() syncOfflineProgressDto: SyncOfflineProgressDto,
  ) {
    return await this.courseService.syncOfflineProgress(syncOfflineProgressDto);
  }

  @Get('course-progress/user/:userId')
  @ApiOperation({ summary: 'Get all course progress for a user' })
  async getUserCourseProgress(@Param('userId') userId: string) {
    return await this.courseService.getUserCourseProgress(userId);
  }

  @Get('course-progress/:courseId/user/:userId')
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
}
