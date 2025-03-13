import { AdditionalResource } from 'src/(resources)/additional_resource/entities/additional_resource.entity';
import { Comment } from 'src/(resources)/comment/entities/comment.entity';
import { Quiz } from 'src/(resources)/quiz/entities/quiz.entity';
import { User } from 'src/(resources)/users/entities/user.entity';
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

  @Column()
  videoUrl: string;

  @Column({ type: 'json' })
  topics: string[];

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
