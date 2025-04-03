import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../entities/course.entity';
import { Repository } from 'typeorm';
import { WebsocketService } from 'src/websockets/websockets.service';
import { CategoryService } from './category.service';
import { S3Service } from 'src/fileUpload/aws/s3.service';
import ffprobe from 'ffprobe';
import * as ffprobeStatic from 'ffprobe-static';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CreateCourseDto } from '../dto/create-course.dto';
import { QueryCourseDto, SortOrder } from '../dto/query-course.dto';
import { paginate } from 'utils/pagination.utils';
import { UpdateCourseDto } from '../dto/update-course.dto';

interface FFProbeStream {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
}

interface FFProbeInfo {
  streams: FFProbeStream[];
  format: {
    duration: string;
  };
}

@Injectable()
export class MainCourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly websocketService: WebsocketService,
    private readonly categoryService: CategoryService,
    private readonly s3Service: S3Service,
  ) {}
  private async extractMetadata(file: Express.Multer.File): Promise<{
    duration: string;
    width?: number;
    height?: number;
    codec?: string;
  }> {
    // Create temporary file for ffprobe to analyze
    const tempPath = path.join(os.tmpdir(), `video-${Date.now()}`);
    fs.writeFileSync(tempPath, file.buffer);

    try {
      const info = await ffprobe(tempPath, { path: ffprobeStatic.path });

      // Delete temp file immediately after analysis
      fs.unlinkSync(tempPath);

      const ffprobeInfo = info as unknown as FFProbeInfo;

      // Add defensive checks for the format property
      if (!ffprobeInfo?.format) {
        console.warn('Video format information is missing');
        return { duration: '00:10:00' }; // Default 10 minutes
      }

      const videoStream: FFProbeStream | undefined = ffprobeInfo.streams?.find(
        (s: FFProbeStream) => s.codec_type === 'video',
      );

      if (!videoStream) {
        console.warn('No video stream found in the file');
        return { duration: '00:10:00' }; // Default 10 minutes
      }

      // Format duration as HH:MM:SS with defensive check
      const durationSecs = ffprobeInfo.format.duration
        ? parseFloat(ffprobeInfo.format.duration)
        : 600; // Default 10 minutes in seconds

      const hours = Math.floor(durationSecs / 3600);
      const minutes = Math.floor((durationSecs % 3600) / 60);
      const seconds = Math.floor(durationSecs % 60);

      const formattedDuration = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0'),
      ].join(':');

      return {
        duration: formattedDuration,
        width: videoStream.width,
        height: videoStream.height,
        codec: videoStream.codec_name,
      };
    } catch (error) {
      console.error('Failed to extract video metadata:', error);
      // Return a default value if extraction fails
      return { duration: '00:10:00' }; // Default 10 minutes
    }
  }

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

      // Extract video metadata
      const { duration, width, height, codec } =
        await this.extractMetadata(video);

      try {
        createCourseDto.duration = duration;
        createCourseDto.width = width;
        createCourseDto.height = height;
        createCourseDto.codec = codec;

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
          await this.categoryService.findOneCategory(
            createCourseDto.categoryId,
          );
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

  async findAllByATeacher(queryOptions: QueryCourseDto = {}, userId: string) {
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
      .leftJoinAndSelect('course.additionalResources', 'additionalResources')
      .where('course.userId = :userId', { userId })
      .andWhere('user.role = :role', { role: 'teacher' });

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
}
