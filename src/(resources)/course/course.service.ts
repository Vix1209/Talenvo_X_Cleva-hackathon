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
import { QuizSubmission } from './entities/quiz-submission.entity';
import { SubmitQuizDto } from './dto/quiz-submission.dto';
import { StudentProfile } from '../users/entities/user-profile.entity';
import { Category } from './entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto/category.dto';

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
    @InjectRepository(QuizSubmission)
    private readonly quizSubmissionRepository: Repository<QuizSubmission>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private websocketService: WebsocketService,
    private notificationService: NotificationService,
    private storageCalculator: StorageCalculatorService,
  ) {}

  // Category Methods
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    try {
      // Check if category with the same name already exists
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: createCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category with name "${createCategoryDto.name}" already exists`,
        );
      }

      const category = this.categoryRepository.create(createCategoryDto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create category: ' + error.message,
      );
    }
  }

  async findAllCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find();

    // Get course counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const courseCount = await this.courseRepository.count({
          where: { categoryId: category.id },
        });

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
          courseCount,
        };
      }),
    );

    return categoriesWithCounts;
  }

  async findOneCategory(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        courses: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const courseCount = await this.courseRepository.count({
      where: { categoryId: id },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      courseCount,
    };
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // If name is being updated, check for conflicts
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if there are courses using this category
    const courseCount = await this.courseRepository.count({
      where: { categoryId: id },
    });

    if (courseCount > 0) {
      throw new BadRequestException(
        `Cannot delete category that contains ${courseCount} courses. Remove or reassign courses first.`,
      );
    }

    await this.categoryRepository.remove(category);
  }

  async getCoursesByCategory(categoryId: string): Promise<Course[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return await this.courseRepository.find({
      where: { categoryId },
      relations: ['user'],
    });
  }

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    try {
      // If categoryId is provided, verify the category exists
      if (createCourseDto.categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: createCourseDto.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Category with ID ${createCourseDto.categoryId} not found`,
          );
        }
      }

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
        'category',
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
        'category',
      ],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);

    // If categoryId is provided, verify the category exists
    if (updateCourseDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateCourseDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateCourseDto.categoryId} not found`,
        );
      }
    }

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

  // Quiz Submission Methods
  async submitQuiz(submitQuizDto: SubmitQuizDto, userId: string) {
    // Get the quiz
    const quiz = await this.quizRepository.findOne({
      where: { id: submitQuizDto.quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Get the user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['studentProfile'],
    });

    if (!user || !user.studentProfile) {
      throw new NotFoundException('Student not found');
    }

    // Process the submission and calculate the score
    const processedAnswers = submitQuizDto.answers.map((answer) => {
      const questionData = quiz.assessment.find(
        (q) => q.question === answer.questionText,
      );

      if (!questionData) {
        throw new BadRequestException(
          `Question "${answer.questionText}" not found in quiz`,
        );
      }

      const isCorrect = questionData.correctAnswer === answer.selectedAnswer;

      return {
        questionId: quiz.assessment.indexOf(questionData).toString(),
        questionText: answer.questionText,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
      };
    });

    const totalQuestions = quiz.assessment.length;
    const correctAnswers = processedAnswers.filter((a) => a.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Create the submission
    const quizSubmission = this.quizSubmissionRepository.create({
      quiz,
      quizId: quiz.id,
      student: user,
      studentId: user.id,
      answers: processedAnswers,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken: submitQuizDto.timeTaken || 0,
      isCompleted: true,
    });

    // Save the submission
    await this.quizSubmissionRepository.save(quizSubmission);

    // Update the student's average quiz score
    await this.updateStudentQuizScores(user.id);

    // Return the submission with calculated data
    return {
      id: quizSubmission.id,
      quizId: quiz.id,
      studentId: user.id,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken: quizSubmission.timeTaken,
      answers: processedAnswers,
      createdAt: quizSubmission.createdAt,
    };
  }

  async getStudentQuizSubmissions(userId: string) {
    const submissions = await this.quizSubmissionRepository.find({
      where: { studentId: userId },
      relations: {
        quiz: true,
      },
      order: { createdAt: 'DESC' },
    });

    return submissions.map((submission) => ({
      id: submission.id,
      quizId: submission.quizId,
      quizTitle: submission.quiz.title,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      correctAnswers: submission.correctAnswers,
      timeTaken: submission.timeTaken,
      createdAt: submission.createdAt,
    }));
  }

  async getQuizSubmission(submissionId: string) {
    const submission = await this.quizSubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['quiz', 'student'],
    });

    if (!submission) {
      throw new NotFoundException('Quiz submission not found');
    }

    return {
      id: submission.id,
      quizId: submission.quizId,
      quizTitle: submission.quiz.title,
      studentId: submission.studentId,
      studentName: `${submission.student.firstName} ${submission.student.lastName}`,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      correctAnswers: submission.correctAnswers,
      timeTaken: submission.timeTaken,
      answers: submission.answers,
      createdAt: submission.createdAt,
    };
  }

  async updateStudentQuizScores(studentId: string) {
    // Get all submissions for this student
    const submissions = await this.quizSubmissionRepository.find({
      where: { studentId },
    });

    if (submissions.length === 0) {
      return; // No submissions yet
    }

    // Calculate average score
    const totalScore = submissions.reduce(
      (sum, submission) => sum + submission.score,
      0,
    );
    const averageScore = totalScore / submissions.length;

    // Update student profile
    const studentProfile = await this.studentProfileRepository.findOne({
      where: { user: { id: studentId } },
    });

    if (studentProfile) {
      studentProfile.averageQuizScore = `${averageScore.toFixed(1)}%`;
      await this.studentProfileRepository.save(studentProfile);
    }

    return averageScore;
  }
}
