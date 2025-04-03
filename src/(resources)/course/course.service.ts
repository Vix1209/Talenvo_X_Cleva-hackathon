import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { QueryCourseDto } from './dto/query-course.dto';
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
import { MainCourseService } from './services/mainCourse.service';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly categoryService: CategoryService,
    private readonly downloadableResourceService: DownloadableResourceService,
    private readonly quizService: QuizService,
    private readonly commentService: CommentService,
    private readonly additionalResourceService: AdditionalResourceService,
    private readonly mainCourseService: MainCourseService,
    private readonly courseProgressService: CourseProgressService,
  ) {}

  // Core Course Methods
  async createCourse(
    createCourseDto: CreateCourseDto,
    video: Express.Multer.File,
    userId: string,
  ): Promise<Course> {
    return this.mainCourseService.createCourse(createCourseDto, video, userId);
  }

  async findAll(queryOptions: QueryCourseDto = {}) {
    return this.mainCourseService.findAll(queryOptions);
  }

  async findAllByATeacher(queryOptions: QueryCourseDto = {}, userId: string) {
    return this.mainCourseService.findAllByATeacher(queryOptions, userId);
  }

  async findOne(id: string): Promise<Course> {
    return this.mainCourseService.findOne(id);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    return this.mainCourseService.update(id, updateCourseDto);
  }

  async remove(id: string): Promise<void> {
    return this.mainCourseService.remove(id);
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
