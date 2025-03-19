import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdditionalResource } from '../entities/additional_resource.entity';
import { Course } from '../entities/course.entity';
import { User } from '../../users/entities/user.entity';
import {
  CreateAdditionalResourceDto,
  UpdateAdditionalResourceDto,
} from '../dto/additional-resource.dto';

@Injectable()
export class AdditionalResourceService {
  constructor(
    @InjectRepository(AdditionalResource)
    private readonly resourceRepository: Repository<AdditionalResource>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
}
