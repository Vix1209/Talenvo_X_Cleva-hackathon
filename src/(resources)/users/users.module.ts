import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import {
  AdminProfile,
  StudentProfile,
  TeacherProfile,
} from './entities/user-profile.entity';
import { Comment } from '../course/entities/comment.entity';
import { AdditionalResource } from '../course/entities/additional_resource.entity';
import { Quiz } from '../course/entities/quiz.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      AdminProfile,
      StudentProfile,
      TeacherProfile,
      Comment,
      AdditionalResource,
      Quiz,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
