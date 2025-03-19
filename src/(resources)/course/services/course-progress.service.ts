import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseProgress } from '../entities/course-progress.entity';
import { Course } from '../entities/course.entity';
import { User } from '../../users/entities/user.entity';
import {
  DeviceInfoDto,
  DownloadCourseDto,
  SyncOfflineProgressDto,
  UpdateProgressDto,
  CourseStorageInfoDto,
} from '../dto/course-progress.dto';
import { WebsocketService } from 'src/websockets/websockets.service';
import { NotificationService } from '../../notification/notification.service';
import { NotificationType } from 'utils/types';
import { StorageCalculatorService } from './storage-calculator.service';

@Injectable()
export class CourseProgressService {
  constructor(
    @InjectRepository(CourseProgress)
    private readonly courseProgressRepository: Repository<CourseProgress>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly websocketService: WebsocketService,
    private readonly notificationService: NotificationService,
    private readonly storageCalculator: StorageCalculatorService,
  ) {}

  async updateProgress(
    updateProgressDto: UpdateProgressDto,
  ): Promise<CourseProgress> {
    const { userId, courseId, progressPercentage, isCompleted, lastPosition } =
      updateProgressDto;

    // Check if course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

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
    const { userId, courseId, deviceInfo, clientStorageInfo } = downloadDto;

    try {
      // Check if course exists and is available for offline access
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['downloadableResources', 'quizzes', 'additionalResources'],
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

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
        totalStorageUsed: clientStorageInfo?.totalStorageUsed || 0,
        maxStorageAllowed: clientStorageInfo?.maxStorageAllowed || 0,
        hasEnoughStorage: clientStorageInfo?.hasEnoughStorage ?? true,
      };

      // Check if user has enough storage based on client info
      if (clientStorageInfo && !clientStorageInfo.hasEnoughStorage) {
        throw new BadRequestException(
          'Not enough storage space available on your device',
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
  async estimateCourseSize(courseId: string): Promise<CourseStorageInfoDto> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['downloadableResources', 'quizzes', 'additionalResources'],
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      const estimatedSize = this.storageCalculator.calculateCourseSize(course);
      const estimatedSizeFormatted =
        this.storageCalculator.formatSize(estimatedSize);

      return {
        estimatedSize,
        estimatedSizeFormatted,
        totalStorageUsed: 0,
        maxStorageAllowed: 0,
        hasEnoughStorage: true,
      };
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
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

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
}
