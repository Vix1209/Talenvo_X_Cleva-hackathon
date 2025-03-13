import { Module } from '@nestjs/common';
import { AdditionalResourceService } from './additional_resource.service';
import { AdditionalResourceController } from './additional_resource.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../course/entities/course.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, User])],
  controllers: [AdditionalResourceController],
  providers: [AdditionalResourceService],
})
export class AdditionalResourceModule {}
