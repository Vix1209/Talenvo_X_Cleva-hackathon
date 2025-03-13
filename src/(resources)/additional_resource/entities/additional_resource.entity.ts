import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ResourceType } from 'utils/types';
import { Course } from 'src/(resources)/course/entities/course.entity';
import { User } from 'src/(resources)/users/entities/user.entity';

@Entity({ name: 'additional_resources' })
export class AdditionalResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ResourceType,
    default: ResourceType.LINK,
  })
  type: ResourceType;

  @Column()
  url: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @ManyToOne(() => Course, (course) => course.uploadedResources)
  @JoinColumn()
  course: Course;
  @Column()
  courseId: string;

  @ManyToOne(() => User, (user) => user.uploadedResources)
  @JoinColumn()
  uploadedResources: User;
  @Column()
  additionalResourcesId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
