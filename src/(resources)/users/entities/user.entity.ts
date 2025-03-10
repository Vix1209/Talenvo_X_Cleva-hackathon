import { Role } from 'src/(resources)/role/entities/role.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';

import {
  TeacherProfile,
  StudentProfile,
  AdminProfile,
} from './user-profile.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  address: string;

  @ManyToOne(() => Role)
  @JoinColumn()
  role: Role;

  @Column({ default: 'active' })
  status: 'active' | 'inactive';

  @Column({ nullable: true })
  gender: 'male' | 'female';

  @Column({ type: 'varchar', nullable: true, select: false })
  verificationToken: string | null;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isResetTokenVerified: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  resetToken: string | null;

  @Column({ type: 'datetime', nullable: true, select: false })
  resetTokenExpiry: Date | null;

  @OneToOne(() => StudentProfile, (student) => student.user, { cascade: true })
  studentProfile?: StudentProfile;

  @OneToOne(() => TeacherProfile, (teacher) => teacher.user, {
    cascade: true,
  })
  teacherProfile?: TeacherProfile;

  @OneToOne(() => AdminProfile, (admin) => admin.user, { cascade: true })
  adminProfile?: AdminProfile;

  @CreateDateColumn({
    select: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    nullable: true,
    select: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
