import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

// ------------------ student Profile ------------------ //
@Entity({ name: 'student_profile' })
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  studentId: string;

  @OneToOne(() => User, (contestant) => contestant.studentProfile)
  @JoinColumn()
  user: User;

  @Column()
  phoneNumber?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: true })
  gradeLevel: string;

  @Column({ nullable: true, type: 'text' })
  preferredSubjects: string;

  @Column({ nullable: true, type: 'text' })
  learningGoals: string;

  @Column({ nullable: true, type: 'text' })
  totalLessonsCompleted: string;

  @Column({ nullable: true, type: 'text' })
  averageQuizScore: string;

  @Column({ nullable: true, type: 'text' })
  badgesEarned: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ------------------ teacher Profile ------------------ //
@Entity({ name: 'teacher_profile' })
export class TeacherProfile {
  @PrimaryGeneratedColumn('uuid')
  teacherId: string;

  @OneToOne(() => User, (contestant) => contestant.teacherProfile)
  @JoinColumn()
  user: User;

  @Column()
  phoneNumber?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column({ nullable: true, type: 'text' })
  subjectsTaught?: string;

  @Column({ nullable: true })
  educationLevel?: string;

  @Column({ nullable: true, type: 'int' })
  teachingExperience?: number;

  @Column({ nullable: true, type: 'text' })
  certifications?: string;

  @Column({ nullable: true, type: 'text' })
  rating?: string;

  @Column({ nullable: true, type: 'int' })
  totalCourses?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ------------------ Admin Profile ------------------ //
@Entity({ name: 'admin_profile' })
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  adminId: string;

  @OneToOne(() => User, (contestant) => contestant.adminProfile)
  @JoinColumn()
  user: User;

  @Column()
  phoneNumber?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: true })
  lastLogin?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
