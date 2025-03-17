import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column('json')
  assessment: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }[];

  @Column({ default: 0 })
  duration: number;

  @Column({ default: false })
  isPublished: boolean;

  @ManyToOne(() => Course, (course) => course.quizzes)
  course: Course;
  @Column()
  courseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
