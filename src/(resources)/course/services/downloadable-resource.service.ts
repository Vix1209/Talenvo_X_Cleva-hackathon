import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownloadableResource } from '../entities/downloadable-resource.entity';
import { Course } from '../entities/course.entity';
import {
  CreateDownloadableResourceDto,
  UpdateDownloadableResourceDto,
} from '../dto/downloadable-resource.dto';
import { WebsocketService } from 'src/websockets/websockets.service';
import { ResourceType } from 'utils/types';

@Injectable()
export class DownloadableResourceService {
  constructor(
    @InjectRepository(DownloadableResource)
    private readonly downloadableResourceRepository: Repository<DownloadableResource>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly websocketService: WebsocketService,
  ) {}

  async addDownloadableResource(
    createDto: CreateDownloadableResourceDto,
  ): Promise<DownloadableResource> {
    if (!createDto.courseId) {
      throw new BadRequestException('Course ID is required');
    }

    const existingcourse = await this.courseRepository.findOne({
      where: { id: createDto.courseId },
    });

    if (!existingcourse) {
      throw new NotFoundException(
        `Course with ID ${createDto.courseId} not found`,
      );
    }

    if (
      [
        ResourceType.LINK,
        ResourceType.IMAGE,
        ResourceType.AUDIO,
        ResourceType.DOCUMENT,
        ResourceType.TEXT,
        ResourceType.VIDEO,
        ResourceType.PDF,
      ].includes(createDto.type as ResourceType) &&
      !createDto.url
    ) {
      throw new BadRequestException(
        `URL is required for ${createDto.type} resources`,
      );
    }

    const course = await this.courseRepository.findOne({
      where: { id: createDto.courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${createDto.courseId} not found`,
      );
    }

    // Create resource entity
    const resource = new DownloadableResource();
    resource.name = createDto.name || '';
    resource.url = createDto.url || '';
    resource.type = createDto.type || '';
    resource.size = createDto.size || 0;
    resource.courseId = course.id;
    resource.lastModified = new Date();

    try {
      const savedResource =
        await this.downloadableResourceRepository.save(resource);

      if (!course.isOfflineAccessible) {
        course.isOfflineAccessible = true;
        await this.courseRepository.save(course);
      }

      this.websocketService.emit('resource-added', {
        courseId: course.id,
        resourceId: savedResource.id,
      });

      return savedResource;
    } catch (error) {
      throw new BadRequestException(
        `Failed to create downloadable resource: ${error.message}`,
      );
    }
  }

  async getDownloadableResources(
    courseId: string,
  ): Promise<DownloadableResource[]> {
    if (!courseId) {
      throw new BadRequestException('Course ID is required');
    }

    // Verify the course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const resources = await this.downloadableResourceRepository.find({
      where: { courseId },
      relations: {
        course: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    resources.forEach((resource) => {
      if (!resource.courseId) {
        resource.courseId = courseId;
      }
    });

    return resources;
  }

  async updateDownloadableResource(
    id: string,
    updateDto: UpdateDownloadableResourceDto,
  ): Promise<DownloadableResource> {
    const resource = await this.downloadableResourceRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!resource) {
      throw new NotFoundException(
        `Downloadable resource with ID ${id} not found`,
      );
    }

    // Save the courseId before updating
    const courseId = resource.courseId;

    // Update only allowed fields from DTO
    Object.assign(resource, {
      name: updateDto.name !== undefined ? updateDto.name : resource.name,
      url: updateDto.url !== undefined ? updateDto.url : resource.url,
      type: updateDto.type !== undefined ? updateDto.type : resource.type,
      size: updateDto.size !== undefined ? updateDto.size : resource.size,
      lastModified: new Date(),
      courseId: courseId,
    });

    const savedResource =
      await this.downloadableResourceRepository.save(resource);

    this.websocketService.emit('resource-updated', {
      courseId: savedResource.courseId,
      resourceId: savedResource.id,
    });

    return savedResource;
  }

  async removeDownloadableResource(id: string): Promise<void> {
    const resource = await this.downloadableResourceRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!resource) {
      throw new NotFoundException(
        `Downloadable resource with ID ${id} not found`,
      );
    }

    const courseId = resource.courseId;

    await this.downloadableResourceRepository.delete(id);

    const remainingResources = await this.downloadableResourceRepository.count({
      where: { courseId },
    });

    if (remainingResources === 0) {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });
      if (course) {
        course.isOfflineAccessible = false;
        await this.courseRepository.save(course);
      }
    }

    this.websocketService.emit('resource-deleted', {
      courseId,
      resourceId: id,
    });
  }
}
