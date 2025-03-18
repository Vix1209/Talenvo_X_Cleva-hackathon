import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
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
  DeviceInfoDto,
  DownloadCourseDto,
  SyncOfflineProgressDto,
  UpdateProgressDto,
  CourseStorageInfoDto,
} from './dto/course-progress.dto';
import { WebsocketService } from 'src/websockets/websockets.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'utils/types';
import { User } from '../users/entities/user.entity';
import { CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import {
  CreateAdditionalResourceDto,
  UpdateAdditionalResourceDto,
} from './dto/additional-resource.dto';
import { Quiz } from './entities/quiz.entity';
import { Comment } from './entities/comment.entity';
import { AdditionalResource } from './entities/additional_resource.entity';
import { StorageCalculatorService } from './services/storage-calculator.service';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseProgress)
    private courseProgressRepository: Repository<CourseProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DownloadableResource)
    private downloadableResourceRepository: Repository<DownloadableResource>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(AdditionalResource)
    private readonly resourceRepository: Repository<AdditionalResource>,
    private websocketService: WebsocketService,
    private notificationService: NotificationService,
    private storageCalculator: StorageCalculatorService,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    try {
      const course = this.courseRepository.create({
        ...createCourseDto,
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
    const course = await this.findOne(courseId);

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
      if (lastPosition !== undefined) {
        progress.lastPosition = lastPosition;
      }
    }

    const savedProgress = await this.courseProgressRepository.save(progress);

    // Send notification for course completion
    if (isCompleted && !progress.isCompleted) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      if (!userId) {
        throw new ConflictException(
          'User ID is required to send notifications',
        );
      }
      await this.notificationService.create({
        recipientId: userId,
        type: NotificationType.SMS,
        title: 'Course Completed! 🎉',
        content: `Congratulations ${user.firstName}! You've completed the course "${course.title}". Keep up the great work!`,
        phoneNumber: user.phoneNumber,
        metadata: {
          courseId: course.id,
          courseName: course.title,
          completedAt: new Date(),
        },
      });
    }
    // Send notification for significant progress (e.g., 50%, 75%)
    else if (
      (progress.progressPercentage < 50 && progressPercentage >= 50) ||
      (progress.progressPercentage < 75 && progressPercentage >= 75)
    ) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      const milestone = progressPercentage >= 75 ? '75%' : '50%';

      if (!userId) {
        throw new ConflictException(
          'User ID is required to send notifications',
        );
      }
      await this.notificationService.create({
        recipientId: userId,
        type: NotificationType.SMS,
        title: `Course Progress: ${milestone}! 🎯`,
        content: `Great progress, ${user.firstName}! You're ${milestone} through "${course.title}". Keep going!`,
        phoneNumber: user.phoneNumber,
        metadata: {
          courseId: course.id,
          courseName: course.title,
          milestone,
          progressPercentage,
        },
      });
    }

    // Notify connected clients about the progress update
    this.websocketService.emit('progress-updated', {
      userId,
      courseId,
      progressPercentage,
      isCompleted: progress.isCompleted,
    });

    return savedProgress;
  }

  async downloadCourse(downloadDto: DownloadCourseDto): Promise<{
    course: Course;
    progress: CourseProgress;
    storageInfo: CourseStorageInfoDto;
  }> {
    const { userId, courseId, deviceInfo } = downloadDto;

    try {
      // Check if course exists and is available for offline access
      const course = await this.findOne(courseId);
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!course.isOfflineAccessible) {
        throw new BadRequestException(
          'This course is not available for offline access',
        );
      }

      // Calculate estimated size of the course
      const estimatedSize = this.storageCalculator.calculateCourseSize(course);

      // Storage information to return to client
      const storageInfo: CourseStorageInfoDto = {
        estimatedSize,
        estimatedSizeFormatted:
          this.storageCalculator.formatSize(estimatedSize),
        totalStorageUsed: 0, // To be determined by frontend
        maxStorageAllowed: 0, // To be determined by frontend
        hasEnoughStorage: true, // To be determined by frontend
      };

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
              deviceInfo: {
                platform: deviceInfo.platform,
                browser: deviceInfo.browser,
                version: deviceInfo.version,
                screenSize: deviceInfo.screenSize,
                model: deviceInfo.model,
                os: deviceInfo.os,
              },
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
          deviceInfo: {
            platform: deviceInfo.platform,
            browser: deviceInfo.browser,
            version: deviceInfo.version,
            screenSize: deviceInfo.screenSize,
            model: deviceInfo.model,
            os: deviceInfo.os,
          },
        });
      }

      // Increment download count for the course
      course.downloadCount = (course.downloadCount || 0) + 1;
      await this.courseRepository.save(course);

      const savedProgress = await this.courseProgressRepository.save(progress);

      // Send notification for course download
      if (!userId) {
        throw new ConflictException(
          'User ID is required to send notifications',
        );
      }
      await this.notificationService.create({
        recipientId: userId,
        type: NotificationType.SMS,
        title: 'Course Downloaded Successfully',
        content: `Hi ${user.firstName}, "${course.title}" has been downloaded for offline access. You can now learn even without an internet connection!`,
        phoneNumber: user.phoneNumber,
        metadata: {
          courseId: course.id,
          courseName: course.title,
          deviceInfo,
          downloadedAt: new Date(),
          estimatedSize: storageInfo.estimatedSizeFormatted,
        },
      });

      return { course, progress: savedProgress, storageInfo };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(`Failed to download course: ${error.message}`);
    }
  }

  /**
   * Estimate the size of a course for storage planning
   */
  async estimateCourseSize(
    courseId: string,
  ): Promise<{ estimatedSize: number; estimatedSizeFormatted: string }> {
    try {
      const course = await this.findOne(courseId);

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      const estimatedSize = this.storageCalculator.calculateCourseSize(course);
      const estimatedSizeFormatted =
        this.storageCalculator.formatSize(estimatedSize);

      return { estimatedSize, estimatedSizeFormatted };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to estimate course size: ${error.message}`);
    }
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
    if (lastPosition !== undefined) {
      progress.lastPosition = lastPosition;
    }

    // Update offline access history
    if (
      progress.offlineAccessHistory &&
      progress.offlineAccessHistory.length > 0
    ) {
      const lastIndex = progress.offlineAccessHistory.length - 1;
      progress.offlineAccessHistory[lastIndex].syncedAt = new Date();
      progress.offlineAccessHistory[lastIndex].deviceInfo = {
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        version: deviceInfo.version,
        screenSize: deviceInfo.screenSize,
        model: deviceInfo.model,
        os: deviceInfo.os,
      };
    }

    // Update course last synced timestamp
    course.lastSyncedAt = new Date();
    await this.courseRepository.save(course);

    const savedProgress = await this.courseProgressRepository.save(progress);

    // Send notification for successful sync
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (!userId) {
      throw new ConflictException('User ID is required to send notifications');
    }
    await this.notificationService.create({
      recipientId: userId,
      type: NotificationType.SMS,
      title: 'Course Progress Synced',
      content: `Hi ${user.firstName}, your progress for "${course.title}" has been successfully synced. You're at ${progressPercentage}% completion.`,
      phoneNumber: user.phoneNumber,
      metadata: {
        courseId: course.id,
        courseName: course.title,
        progressPercentage,
        deviceInfo,
        syncedAt: new Date(),
      },
    });

    // Notify connected clients about the sync
    this.websocketService.emit('progress-synced', {
      userId,
      courseId,
      progressPercentage,
      isCompleted: progress.isCompleted,
      syncedAt: new Date(),
      deviceInfo: {
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        version: deviceInfo.version,
        screenSize: deviceInfo.screenSize,
        model: deviceInfo.model,
        os: deviceInfo.os,
      },
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

  // Quiz Methods
  async createQuiz(createQuizDto: CreateQuizDto) {
    const course = await this.courseRepository.findOne({
      where: { id: createQuizDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const quiz = this.quizRepository.create({
      ...createQuizDto,
      course,
    });

    return await this.quizRepository.save(quiz);
  }

  async getQuizzes(courseId: string) {
    return await this.quizRepository.find({
      where: { course: { id: courseId } },
    });
  }

  async getQuiz(quizId: string) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async updateQuiz(quizId: string, updateQuizDto: UpdateQuizDto) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    Object.assign(quiz, updateQuizDto);
    return await this.quizRepository.save(quiz);
  }

  async deleteQuiz(quizId: string) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    await this.quizRepository.remove(quiz);
    return { message: 'Quiz deleted successfully' };
  }

  // Comment Methods
  async createComment(createCommentDto: CreateCommentDto, userId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: createCommentDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      course,
      userId,
    });

    return await this.commentRepository.save(comment);
  }

  async getComments(courseId: string) {
    return await this.commentRepository.find({
      where: { course: { id: courseId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    Object.assign(comment, updateCommentDto);
    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
    return { message: 'Comment deleted successfully' };
  }

  // Additional Resource Methods
  async createAdditionalResource(
    createResourceDto: CreateAdditionalResourceDto,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: createResourceDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: createResourceDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resource = this.resourceRepository.create({
      ...createResourceDto,
      course,
      uploadedBy: user,
    });

    return await this.resourceRepository.save(resource);
  }

  async getAdditionalResources(courseId: string) {
    return await this.resourceRepository.find({
      where: { courseId },
      relations: ['course', 'uploadedBy'],
    });
  }

  async updateAdditionalResource(
    resourceId: string,
    updateResourceDto: UpdateAdditionalResourceDto,
    userId: string,
  ) {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: ['uploadedBy'],
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (resource.uploadedBy.id !== userId) {
      throw new ForbiddenException(
        'You can only update resources you uploaded',
      );
    }

    Object.assign(resource, updateResourceDto);
    return await this.resourceRepository.save(resource);
  }

  async deleteAdditionalResource(resourceId: string, userId: string) {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: ['uploadedBy'],
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (resource.uploadedBy.id !== userId) {
      throw new ForbiddenException(
        'You can only delete resources you uploaded',
      );
    }

    await this.resourceRepository.remove(resource);
    return { message: 'Resource deleted successfully' };
  }
}
