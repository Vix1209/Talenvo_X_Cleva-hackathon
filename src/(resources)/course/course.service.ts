import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { WebsocketService } from 'src/websockets/websockets.service';
import { QueryCourseDto, SortOrder } from './dto/query-course.dto';
import { paginate } from 'utils/pagination.utils';
import {
  CategoryService,
  DownloadableResourceService,
  QuizService,
  CommentService,
  AdditionalResourceService,
  CourseProgressService,
} from './services';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto';
import { SubmitQuizDto } from './dto/quiz-submission.dto';
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
import { S3Service } from 'src/fileUpload/aws/s3.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly websocketService: WebsocketService,
    private readonly categoryService: CategoryService,
    private readonly downloadableResourceService: DownloadableResourceService,
    private readonly quizService: QuizService,
    private readonly commentService: CommentService,
    private readonly additionalResourceService: AdditionalResourceService,
    private readonly courseProgressService: CourseProgressService,
    private readonly s3Service: S3Service,
  ) {}

  // Core Course Methods
  async createCourse(
    createCourseDto: CreateCourseDto,
    video: Express.Multer.File,
    userId: string,
  ): Promise<Course> {
    try {
      if (!video) {
        throw new BadRequestException('Video file is required');
      }

      try {
        // Generate a temporary ID for tracking this upload
        const uploadId = Date.now().toString();
        console.log(`Starting video upload process (ID: ${uploadId})`);

        createCourseDto.userId = userId;

        if (Array.isArray(createCourseDto.topics)) {
          createCourseDto.topics;
        } else {
          createCourseDto.topics = [createCourseDto.topics];
        }

        // If categoryId is provided, verify the category exists
        if (createCourseDto.categoryId) {
          await this.findOneCategory(createCourseDto.categoryId);
        } else {
          throw new BadRequestException('Category ID is required');
        }

        // Initial upload notification
        this.websocketService.emit('course-upload-progress', {
          uploadId,
          userId: createCourseDto.userId,
          progress: 0,
          status: 'started',
          courseTitle: createCourseDto.title,
        });

        // Define progress callback function
        const progressCallback = (progress: number) => {
          // Emit progress updates via websocket
          this.websocketService.emit('course-upload-progress', {
            uploadId,
            userId: createCourseDto.userId,
            progress,
            status: progress < 100 ? 'uploading' : 'processing',
            courseTitle: createCourseDto.title,
          });
        };

        // Upload video to S3 and get CloudFront URLs
        const { cloudfrontStreamingUrl, key } =
          await this.s3Service.uploadVideo(video, progressCallback);

        console.log('Video upload completed:');
        console.log('- CloudFront Streaming URL:', cloudfrontStreamingUrl);

        // Notify that we're now creating the course
        this.websocketService.emit('course-upload-progress', {
          uploadId,
          userId: createCourseDto.userId,
          progress: 100,
          status: 'saving',
          courseTitle: createCourseDto.title,
        });

        // Create the course in the database with all URLs
        createCourseDto.videoUrl = cloudfrontStreamingUrl; // Primary URL for streaming
        createCourseDto.videoStreamingUrl = `${cloudfrontStreamingUrl}?response-content-disposition=attachment#t=5`; // Start at 5 seconds
        createCourseDto.videoKey = key;

        const createcourse = this.courseRepository.create({
          ...createCourseDto,
        });
        const course = await this.courseRepository.save(createcourse);
        // Final notification that course is created
        this.websocketService.emit('course-upload-progress', {
          uploadId,
          userId: createCourseDto.userId,
          progress: 100,
          status: 'completed',
          courseTitle: createCourseDto.title,
          courseId: course.id,
        });

        // Broadcast to anyone interested that a new course was added
        this.websocketService.emit('course-updated', { courseId: course.id });

        return course;
      } catch (error) {
        console.error('Course creation error:', error);

        // Error notification
        this.websocketService.emit('course-upload-progress', {
          userId: createCourseDto.userId,
          progress: 0,
          status: 'failed',
          error: error.message || 'Upload failed',
        });

        if (video.path && fs.existsSync(video.path)) {
          fs.unlinkSync(video.path);
        }
        throw error;
      }
    } catch (error) {
      throw new BadRequestException(
        'Failed to create course: ' + error.message,
      );
    }
  }

  async findAll(queryOptions: QueryCourseDto = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      sortBy = 'createdAt',
      sortOrder = SortOrder.DESC,
    } = queryOptions;

    // Create query builder
    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.user', 'user')
      .leftJoinAndSelect('course.category', 'category')
      .leftJoinAndSelect('course.comments', 'comments')
      .leftJoinAndSelect('course.quizzes', 'quizzes')
      .leftJoinAndSelect('course.additionalResources', 'additionalResources');

    // Apply search filter if provided
    if (search) {
      query.andWhere(
        '(course.title LIKE :search OR course.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply category filter if provided
    if (categoryId) {
      query.andWhere('course.categoryId = :categoryId', { categoryId });
    }

    // Apply sorting
    const validSortColumns = [
      'title',
      'createdAt',
      'updatedAt',
      'downloadCount',
    ];

    // Default to createdAt if sortBy is not valid
    const actualSortBy = validSortColumns.includes(sortBy)
      ? sortBy
      : 'createdAt';
    query.orderBy(`course.${actualSortBy}`, sortOrder);

    // Execute query with pagination
    const [results, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      ...paginate(results, limit ?? 10, page ?? 1, totalPages),
    };
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: [
        'user',
        'comments',
        'quizzes',
        'additionalResources',
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
      await this.categoryService.findOneCategory(updateCourseDto.categoryId);
    } else {
    }

    Object.assign(course, updateCourseDto);

    // Notify connected clients about the course update
    this.websocketService.emit('course-updated', { courseId: id });

    return await this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);

    this.websocketService.emit('course-deleted', { courseId: id });
  }

  // Delegate to Category Service
  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  async findAllCategories() {
    return this.categoryService.findAllCategories();
  }

  async findOneCategory(id: string) {
    return this.categoryService.findOneCategory(id);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  async removeCategory(id: string) {
    return this.categoryService.removeCategory(id);
  }

  async getCoursesByCategory(categoryId: string) {
    return this.categoryService.getCoursesByCategory(categoryId);
  }

  // Delegate to Downloadable Resource Service
  async toggleCourseDownloadStatus(courseId: string) {
    return this.downloadableResourceService.toggleCourseDownloadStatus(
      courseId,
    );
  }

  // Delegate to Quiz Service
  async createQuiz(createQuizDto: CreateQuizDto) {
    return this.quizService.createQuiz(createQuizDto);
  }

  async getQuizzes(courseId: string) {
    return this.quizService.getQuizzes(courseId);
  }

  async getQuiz(quizId: string) {
    return this.quizService.getQuiz(quizId);
  }

  async updateQuiz(quizId: string, updateQuizDto: UpdateQuizDto) {
    return this.quizService.updateQuiz(quizId, updateQuizDto);
  }

  async deleteQuiz(quizId: string) {
    return this.quizService.deleteQuiz(quizId);
  }

  async submitQuiz(submitQuizDto: SubmitQuizDto, userId: string) {
    return this.quizService.submitQuiz(submitQuizDto, userId);
  }

  async getStudentQuizSubmissions(userId: string) {
    return this.quizService.getStudentQuizSubmissions(userId);
  }

  async getQuizSubmission(submissionId: string) {
    return this.quizService.getQuizSubmission(submissionId);
  }

  // Delegate to Comment Service
  async createComment(createCommentDto: CreateCommentDto, userId: string) {
    return this.commentService.createComment(createCommentDto, userId);
  }

  async getComments(courseId: string) {
    return this.commentService.getComments(courseId);
  }

  async updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ) {
    return this.commentService.updateComment(
      commentId,
      updateCommentDto,
      userId,
    );
  }

  async deleteComment(commentId: string, userId: string) {
    return this.commentService.deleteComment(commentId, userId);
  }

  // Delegate to Additional Resource Service
  async createAdditionalResource(
    createResourceDto: CreateAdditionalResourceDto,
  ) {
    return this.additionalResourceService.createAdditionalResource(
      createResourceDto,
    );
  }

  async getAdditionalResources(courseId: string) {
    return this.additionalResourceService.getAdditionalResources(courseId);
  }

  async updateAdditionalResource(
    resourceId: string,
    updateResourceDto: UpdateAdditionalResourceDto,
    userId: string,
  ) {
    return this.additionalResourceService.updateAdditionalResource(
      resourceId,
      updateResourceDto,
      userId,
    );
  }

  async deleteAdditionalResource(resourceId: string, userId: string) {
    return this.additionalResourceService.deleteAdditionalResource(
      resourceId,
      userId,
    );
  }

  // Delegate to Course Progress Service
  async updateProgress(updateProgressDto: UpdateProgressDto) {
    return this.courseProgressService.updateProgress(updateProgressDto);
  }

  async downloadCourse(downloadDto: DownloadCourseDto) {
    return this.courseProgressService.downloadCourse(downloadDto);
  }

  async estimateCourseSize(courseId: string) {
    return this.courseProgressService.estimateCourseSize(courseId);
  }

  async syncOfflineProgress(syncDto: SyncOfflineProgressDto) {
    return this.courseProgressService.syncOfflineProgress(syncDto);
  }

  async getUserCourseProgress(userId: string) {
    return this.courseProgressService.getUserCourseProgress(userId);
  }

  async getCourseProgressByUserAndCourse(userId: string, courseId: string) {
    return this.courseProgressService.getCourseProgressByUserAndCourse(
      userId,
      courseId,
    );
  }
}
