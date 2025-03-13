import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../comment/entities/comment.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { AdditionalResource } from '../additional_resource/entities/additional_resource.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Quiz, AdditionalResource, User]),
  ],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
