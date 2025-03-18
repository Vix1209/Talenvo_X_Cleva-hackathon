import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quiz)
  @JoinColumn()
  quiz: Quiz;

  @Column()
  quizId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  student: User;

  @Column()
  studentId: string;

  @Column('json')
  answers: {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }[];

  @Column('float')
  score: number;

  @Column()
  totalQuestions: number;

  @Column()
  correctAnswers: number;

  @Column({ default: true })
  isCompleted: boolean;

  @Column({ nullable: true })
  timeTaken: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
