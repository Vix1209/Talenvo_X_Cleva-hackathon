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

@Entity({ name: 'downloadable_resources' })
export class DownloadableResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  type: string;

  @Column({ type: 'bigint', nullable: true })
  size: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastModified: Date;

  @ManyToOne(() => Course, (course) => course.downloadableResources)
  @JoinColumn()
  course: Course;

  @Column()
  courseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
