import { AdditionalResource } from 'src/(resources)/course/entities/additional_resource.entity';
import { Comment } from 'src/(resources)/course/entities/comment.entity';
import { Quiz } from 'src/(resources)/course/entities/quiz.entity';
import { User } from 'src/(resources)/users/entities/user.entity';
import { Category } from './category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'text' })
  videoUrl: string;

  @Column({ type: 'text', nullable: true })
  videoStreamingUrl: string;

  @Column({ type: 'text', nullable: true, select: false })
  videoKey: string;

  @Column({ type: 'json' })
  topics: string[];

  @Column({ default: false })
  isOfflineAccessible: boolean;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ nullable: true })
  lastSyncedAt: Date;

  @ManyToOne(() => Category, (category) => category.courses, { nullable: true })
  @JoinColumn()
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @OneToMany(() => Comment, (comment) => comment.course)
  comments: Comment[];

  @OneToMany(() => Quiz, (quiz) => quiz.course)
  quizzes: Quiz[];

  @OneToMany(() => AdditionalResource, (resource) => resource.course, {
    cascade: true,
  })
  additionalResources?: AdditionalResource[];

  @ManyToOne(() => User, (user) => user.courses)
  @JoinColumn()
  user: User;
  @Column()
  userId: string;

  @Column()
  duration: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
