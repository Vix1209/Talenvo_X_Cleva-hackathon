import { AdditionalResource } from 'src/(resources)/additional_resource/entities/additional_resource.entity';
import { Comment } from 'src/(resources)/comment/entities/comment.entity';
import { Quiz } from 'src/(resources)/quiz/entities/quiz.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column()
  videoUrl: string;

  @Column({ type: 'json' })
  topics: string[];

  @OneToMany(() => Comment, (comment) => comment.course)
  comment: Comment[];

  @OneToMany(() => Quiz, (quiz) => quiz.course)
  quiz: Quiz[];

  @OneToMany(
    () => AdditionalResource,
    (resource) => resource.uploadedResources,
    {
      cascade: true,
    },
  )
  uploadedResources?: AdditionalResource[];

  @Column()
  duration: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
