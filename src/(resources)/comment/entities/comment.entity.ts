import { Course } from 'src/(resources)/course/entities/course.entity';
import { User } from 'src/(resources)/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.comment)
  @JoinColumn()
  course: Course;
  @Column()
  courseId: string;

  @ManyToOne(() => User, (user) => user.comment)
  @JoinColumn()
  user: User;
  @Column()
  userId: string;
}
