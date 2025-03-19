import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course } from './entities/course.entity';
import { CourseProgress } from './entities/course-progress.entity';
import { DownloadableResource } from './entities/downloadable-resource.entity';
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
} from './services';
import { Role } from '../role/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseProgress,
      User,
      DownloadableResource,
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
  ],
  exports: [CourseService],
})
export class CourseModule {}
