import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Quiz } from './entities/quiz.entity';
import { AdditionalResource } from './entities/additional_resource.entity';
import { User } from '../users/entities/user.entity';
import { Course } from './entities/course.entity';
import { CourseProgress } from './entities/course-progress.entity';
import { DownloadableResource } from './entities/downloadable-resource.entity';
import { WebsocketModule } from 'src/websockets/websockets.module';
import { Role } from '../role/entities/role.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseProgress,
      Comment,
      Quiz,
      AdditionalResource,
      User,
      DownloadableResource,
      Role,
    ]),
    WebsocketModule,
    NotificationModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
