import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

// ------------------ Voter Profile ------------------ //
@Entity({ name: 'student_profile' })
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (contestant) => contestant.studentProfile)
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  votesCast?: number;

  @Column('json', { nullable: true })
  votingHistory?: { contestantId: string; votes: number; date: string }[];

  @Column({ nullable: true })
  voterLevel?: number;

  @Column({ nullable: true })
  lastVotedContestant?: string;
}

// ------------------ Contestant Profile ------------------ //
@Entity({ name: 'teacher_profile' })
export class TeacherProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (contestant) => contestant.teacherProfile)
  @JoinColumn()
  user: User;

  @Column({ type: 'enum', enum: ['male', 'female'], nullable: true })
  gender?: 'male' | 'female';

  @Column({ nullable: true })
  height?: string;

  @Column({ nullable: true })
  nationality?: string;

  @Column({ nullable: true })
  instagram?: string;

  @Column({ nullable: true })
  tiktok?: string;

  @Column({ nullable: true })
  currentOccupation?: string;

  @Column({ nullable: true })
  motivation?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  ranking?: number;

  @Column({ nullable: true })
  totalVotes?: number;

  @Column('json', { nullable: true })
  portfolioImages?: string[];
}

// ------------------ Admin Profile ------------------ //
@Entity({ name: 'admin_profile' })
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (contestant) => contestant.adminProfile)
  @JoinColumn()
  user: User;

  @Column({
    type: 'enum',
    enum: ['Operations', 'Finance', 'Marketing', 'Tech Support'],
    nullable: true,
  })
  department?: 'Operations' | 'Finance' | 'Marketing' | 'Tech Support';

  @Column('json', { nullable: true })
  permissions?: (
    | 'manage_users'
    | 'approve_votes'
    | 'view_leaderboard'
    | 'ban_users'
  )[];

  @Column({ nullable: true })
  lastLogin?: string;
}
