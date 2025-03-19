import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Course } from '../entities/course.entity';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async createComment(createCommentDto: CreateCommentDto, userId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: createCommentDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    let parentComment;
    if (createCommentDto.parentCommentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentCommentId },
      });

      if (parentComment && parentComment.courseId !== course.id) {
        throw new BadRequestException(
          'Parent comment not found in this course',
        );
      }
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      course,
      userId,
      parentCommentId: parentComment?.id || null,
    });

    return await this.commentRepository.save(comment);
  }

  async getComments(courseId: string) {
    return await this.commentRepository.find({
      where: { course: { id: courseId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    Object.assign(comment, updateCommentDto);
    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
    return { message: 'Comment deleted successfully' };
  }
}
