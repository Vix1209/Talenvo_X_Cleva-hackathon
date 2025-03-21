import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { WebsocketService } from 'src/websockets/websockets.service';

@Injectable()
export class DownloadableResourceService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly websockets: WebsocketService,
  ) {}

  async toggleCourseDownloadStatus(courseId: string) {
    if (!courseId) {
      throw new BadRequestException('Course ID is required');
    }

    const existingcourse = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!existingcourse) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    existingcourse.isOfflineAccessible = !existingcourse.isOfflineAccessible;

    await this.courseRepository.save(existingcourse);

    const message = `${existingcourse.isOfflineAccessible == true ? `${existingcourse.title} is open to be downloaded` : `${existingcourse.title} is offline inaccessible, and cannot be downloaded`}`;

    this.websockets.emit('course-download-status', message);

    return {
      message,
    };
  }
}
