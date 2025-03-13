import { Course } from 'src/(resources)/course/entities/course.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'quiz' })
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  header: string;

  @Column()
  question: string;

  @Column({ type: 'json' })
  options: string[];

  @ManyToOne(() => Course, (course) => course.quizzes)
  @JoinColumn()
  course: Course;
  @Column()
  courseId: string;
}
