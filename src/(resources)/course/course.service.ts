import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { CourseProgress } from './entities/course-progress.entity';
import { DownloadableResource } from './entities/downloadable-resource.entity';
import {
  CreateDownloadableResourceDto,
  UpdateDownloadableResourceDto,
} from './dto/downloadable-resource.dto';
import {
  DownloadCourseDto,
  SyncOfflineProgressDto,
  UpdateProgressDto,
} from './dto/course-progress.dto';
import { WebsocketService } from 'src/websockets/websockets.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(CourseProgress)
    private courseProgressRepository: Repository<CourseProgress>,
    @InjectRepository(DownloadableResource)
    private downloadableResourceRepository: Repository<DownloadableResource>,
    private websocketService: WebsocketService,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    try {
      const course = this.courseRepository.create({
        ...createCourseDto,
        isOfflineAccessible: createCourseDto.isOfflineAccessible || false,
      });

      return await this.courseRepository.save(course);
    } catch (error) {
      throw new BadRequestException(
        'Failed to create course: ' + error.message,
      );
    }
  }

  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find({
      relations: [
        'user',
        'comments',
        'quizzes',
        'additionalResources',
        'downloadableResources',
      ],
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: [
        'user',
        'comments',
        'quizzes',
        'additionalResources',
        'downloadableResources',
      ],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, updateCourseDto);

    // Notify connected clients about the course update
    this.websocketService.emit('course-updated', { courseId: id });

    return await this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);

    // Notify connected clients about the course deletion
    this.websocketService.emit('course-deleted', { courseId: id });
  }

  // Downloadable Resource Methods

  async addDownloadableResource(
    createDto: CreateDownloadableResourceDto,
  ): Promise<DownloadableResource> {
    const course = await this.findOne(createDto.courseId);

    const resource = this.downloadableResourceRepository.create({
      ...createDto,
      lastModified: new Date(),
    });

    const savedResource =
      await this.downloadableResourceRepository.save(resource);

    // Update course's offline accessibility
    course.isOfflineAccessible = true;
    await this.courseRepository.save(course);

    // Notify connected clients about the new resource
    this.websocketService.emit('resource-added', {
      courseId: course.id,
      resourceId: savedResource.id,
    });

    return savedResource;
  }

  async updateDownloadableResource(
    id: string,
    updateDto: UpdateDownloadableResourceDto,
  ): Promise<DownloadableResource> {
    const resource = await this.downloadableResourceRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!resource) {
      throw new NotFoundException(
        `Downloadable resource with ID ${id} not found`,
      );
    }

    Object.assign(resource, {
      ...updateDto,
      lastModified: new Date(),
    });

    const savedResource =
      await this.downloadableResourceRepository.save(resource);

    // Notify connected clients about the resource update
    this.websocketService.emit('resource-updated', {
      courseId: resource.courseId,
      resourceId: savedResource.id,
    });

    return savedResource;
  }

  async removeDownloadableResource(id: string): Promise<void> {
    const resource = await this.downloadableResourceRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!resource) {
      throw new NotFoundException(
        `Downloadable resource with ID ${id} not found`,
      );
    }

    await this.downloadableResourceRepository.remove(resource);

    // Check if course still has any downloadable resources
    const remainingResources = await this.downloadableResourceRepository.count({
      where: { courseId: resource.courseId },
    });

    // Update course's offline accessibility if no resources remain
    if (remainingResources === 0) {
      const course = await this.findOne(resource.courseId);
      course.isOfflineAccessible = false;
      await this.courseRepository.save(course);
    }

    // Notify connected clients about the resource deletion
    this.websocketService.emit('resource-deleted', {
      courseId: resource.courseId,
      resourceId: id,
    });
  }

  // Course Progress and Offline Access Methods

  async updateProgress(
    updateProgressDto: UpdateProgressDto,
  ): Promise<CourseProgress> {
    const { userId, courseId, progressPercentage, isCompleted, lastPosition } =
      updateProgressDto;

    // Check if course exists
    await this.findOne(courseId);

    // Find existing progress or create new
    let progress = await this.courseProgressRepository.findOne({
      where: { userId, courseId },
    });

    if (!progress) {
      progress = this.courseProgressRepository.create({
        userId,
        courseId,
        progressPercentage,
        isCompleted: isCompleted || false,
        lastPosition,
      });
    } else {
      progress.progressPercentage = progressPercentage;
      if (isCompleted !== undefined) {
        progress.isCompleted = isCompleted;
      }
      if (lastPosition) {
        progress.lastPosition = lastPosition;
      }
    }

    const savedProgress = await this.courseProgressRepository.save(progress);

    // Notify connected clients about the progress update
    this.websocketService.emit('progress-updated', {
      userId,
      courseId,
      progressPercentage,
      isCompleted: progress.isCompleted,
    });

    return savedProgress;
  }

  async downloadCourse(
    downloadDto: DownloadCourseDto,
  ): Promise<{ course: Course; progress: CourseProgress }> {
    const { userId, courseId, deviceInfo } = downloadDto;

    // Check if course exists and is available for offline access
    const course = await this.findOne(courseId);

    if (!course.isOfflineAccessible) {
      throw new BadRequestException(
        'This course is not available for offline access',
      );
    }

    // Find or create progress record
    let progress = await this.courseProgressRepository.findOne({
      where: { userId, courseId },
    });

    if (!progress) {
      progress = this.courseProgressRepository.create({
        userId,
        courseId,
        progressPercentage: 0,
        isCompleted: false,
        isDownloadedOffline: true,
        offlineAccessHistory: [
          {
            downloadedAt: new Date(),
            syncedAt: undefined,
            deviceInfo,
          },
        ],
      });
    } else {
      progress.isDownloadedOffline = true;

      // Initialize offlineAccessHistory if it doesn't exist
      if (!progress.offlineAccessHistory) {
        progress.offlineAccessHistory = [];
      }

      progress.offlineAccessHistory.push({
        downloadedAt: new Date(),
        syncedAt: undefined,
        deviceInfo,
      });
    }

    // Increment download count for the course
    course.downloadCount += 1;
    await this.courseRepository.save(course);

    const savedProgress = await this.courseProgressRepository.save(progress);

    // Notify connected clients about the download
    this.websocketService.emit('course-downloaded', {
      userId,
      courseId,
      deviceInfo,
      timestamp: new Date(),
    });

    return { course, progress: savedProgress };
  }

  async syncOfflineProgress(
    syncDto: SyncOfflineProgressDto,
  ): Promise<CourseProgress> {
    const {
      userId,
      courseId,
      progressPercentage,
      isCompleted,
      lastPosition,
      deviceInfo,
      lastModifiedOffline,
    } = syncDto;

    // Check if course exists
    const course = await this.findOne(courseId);

    // Find progress record
    let progress = await this.courseProgressRepository.findOne({
      where: { userId, courseId },
    });

    if (!progress) {
      throw new NotFoundException(
        `No progress record found for user ${userId} and course ${courseId}`,
      );
    }

    // Update progress with offline data
    progress.progressPercentage = progressPercentage;
    if (isCompleted !== undefined) {
      progress.isCompleted = isCompleted;
    }
    if (lastPosition) {
      progress.lastPosition = lastPosition;
    }

    // Update offline access history
    if (
      progress.offlineAccessHistory &&
      progress.offlineAccessHistory.length > 0
    ) {
      const lastIndex = progress.offlineAccessHistory.length - 1;
      progress.offlineAccessHistory[lastIndex].syncedAt = new Date();
    }

    // Update course last synced timestamp
    course.lastSyncedAt = new Date();
    await this.courseRepository.save(course);

    const savedProgress = await this.courseProgressRepository.save(progress);

    // Notify connected clients about the sync
    this.websocketService.emit('progress-synced', {
      userId,
      courseId,
      progressPercentage,
      isCompleted: progress.isCompleted,
      syncedAt: new Date(),
    });

    return savedProgress;
  }

  async getUserCourseProgress(userId: string): Promise<CourseProgress[]> {
    return await this.courseProgressRepository.find({
      where: { userId },
      relations: ['course'],
    });
  }

  async getCourseProgressByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseProgress> {
    const progress = await this.courseProgressRepository.findOne({
      where: { userId, courseId },
    });

    if (!progress) {
      throw new NotFoundException(
        `No progress found for user ${userId} and course ${courseId}`,
      );
    }

    return progress;
  }
}
