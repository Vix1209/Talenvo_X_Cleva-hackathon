import { User } from 'src/(resources)/users/entities/user.entity';
import { Course } from './course.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'course_progress' })
export class CourseProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Course)
  @JoinColumn()
  course: Course;

  @Column()
  courseId: string;

  @Column({ type: 'float', default: 0 })
  progressPercentage: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isDownloadedOffline: boolean;

  @Column({ type: 'json', nullable: true })
  offlineAccessHistory: {
    downloadedAt: Date;
    syncedAt?: Date;
    deviceInfo: string;
  }[];

  @Column({ type: 'json', nullable: true })
  lastPosition: {
    section: string;
    timestamp: number;
    completedResources: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
