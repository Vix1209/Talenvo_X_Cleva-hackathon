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

  @Column({ nullable: true, type: 'varchar' })
  name: string | null;

  @Column({ nullable: true, type: 'varchar' })
  url: string | null;

  @Column({ nullable: true, type: 'varchar' })
  type: string | null;

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
