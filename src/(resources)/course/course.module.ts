import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course } from './entities/course.entity';
import { CourseProgress } from './entities/course-progress.entity';
import { User } from '../users/entities/user.entity';
import { Category } from './entities/category.entity';
import { Quiz } from './entities/quiz.entity';
import { Comment } from './entities/comment.entity';
import { AdditionalResource } from './entities/additional_resource.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { StudentProfile } from '../users/entities/user-profile.entity';
import { WebsocketModule } from 'src/websockets/websockets.module';
import { NotificationModule } from '../notification/notification.module';
import {
  CategoryService,
  DownloadableResourceService,
  QuizService,
  CommentService,
  AdditionalResourceService,
  CourseProgressService,
  StorageCalculatorService,
  MainCourseService,
} from './services';
import { Role } from '../role/entities/role.entity';
import { CloudinaryUploadService } from '../../fileUpload/cloudinary/cloudinaryUpload.service';
import { S3Service } from '../../fileUpload/aws/s3.service';
import { AwsModule } from '../../fileUpload/aws/aws.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseProgress,
      User,
      Quiz,
      Comment,
      AdditionalResource,
      QuizSubmission,
      StudentProfile,
      Role,
      Category,
    ]),
    WebsocketModule,
    NotificationModule,
    AwsModule,
  ],
  controllers: [CourseController],
  providers: [
    CourseService,
    CategoryService,
    DownloadableResourceService,
    QuizService,
    CommentService,
    AdditionalResourceService,
    CourseProgressService,
    StorageCalculatorService,
    CloudinaryUploadService,
    S3Service,
    MainCourseService,
  ],
  exports: [CourseService],
})
export class CourseModule {}
