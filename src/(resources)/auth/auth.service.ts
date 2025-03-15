import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/(resources)/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { MoreThan, Repository } from 'typeorm';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import {
  CreateStudentDto,
  CreateTeacherDto,
  CreateUserDto,
} from './dto/create-account.dto';
import { MailService } from 'src/mail/mail.service';
import { Role } from 'src/(resources)/role/entities/role.entity';
import { CloudinaryUploadService } from 'src/cloudinary/cloudinaryUpload.service';

import { EmailValidationException } from 'utils';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import {
  AdminProfile,
  StudentProfile,
  TeacherProfile,
} from 'src/(resources)/users/entities/user-profile.entity';
import { CreateAdminDto } from './dto/create-account.dto';
import { ResetTokenDto } from './dto/reset-token.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'utils/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(AdminProfile)
    private readonly adminProfileRepository: Repository<AdminProfile>,

    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,

    @InjectRepository(TeacherProfile)
    private readonly teacherProfileRepository: Repository<TeacherProfile>,

    private jwtService: JwtService,
    private mailService: MailService,
    private cloudinaryUploadService: CloudinaryUploadService,
    private notificationService: NotificationService,
  ) {}

  private async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = (await this.studentProfileRepository.count()) + 1;
    return `STU${year}${count.toString().padStart(4, '0')}`;
  }

  private async generateTeacherId(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = (await this.teacherProfileRepository.count()) + 1;
    return `TCH${year}${count.toString().padStart(4, '0')}`;
  }

  private async generateAdminId(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = (await this.adminProfileRepository.count()) + 1;
    return `ADM${year}${count.toString().padStart(4, '0')}`;
  }

  async create_student(createStudentDto: CreateStudentDto) {
    if (!createStudentDto.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await hash(createStudentDto.password, 10);

    const { existingRole, token, phoneNumber } =
      await this.validateAndPrepareUser(
        createStudentDto as CreateUserDto,
        'student',
        createStudentDto.phoneNumber,
      );

    // Create user
    const account = this.userRepository.create({
      ...createStudentDto,
      password: hashedPassword,
      verificationToken: token,
      role: existingRole,
      phoneNumber,
    });

    const newAccount = await this.userRepository.save(account);

    // Create student profile
    const studentProfile = this.studentProfileRepository.create({
      user: newAccount,
      studentId: await this.generateStudentId(),
      profilePicture: createStudentDto.profilePicture,
      gradeLevel: createStudentDto.gradeLevel,
      preferredSubjects: createStudentDto.preferredSubjects,
      learningGoals: createStudentDto.learningGoals,
      totalLessonsCompleted: '0',
      averageQuizScore: '0',
      badgesEarned: '',
    });

    await this.studentProfileRepository.save(studentProfile);

    // Send verification email
    await this.mailService.sendUserConfirmation(newAccount, token, true);

    // Send welcome notification
    await this.notificationService.create({
      recipientId: newAccount.id,
      type: NotificationType.SMS,
      title: 'Welcome to Talenvo!',
      content: `Welcome ${newAccount.firstName}! Your student account has been created successfully. Your student ID is ${studentProfile.studentId}. Please verify your email to get started.`,
      phoneNumber: newAccount.phoneNumber,
    });

    const { password, verificationToken, ...result } = newAccount;
    return result;
  }

  async create_Teacher(createTeacherDto: CreateTeacherDto) {
    if (!createTeacherDto.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await hash(createTeacherDto.password, 10);

    const { existingRole, token, phoneNumber } =
      await this.validateAndPrepareUser(
        createTeacherDto as CreateUserDto,
        'teacher',
        createTeacherDto.phoneNumber,
      );

    // Create user
    const account = this.userRepository.create({
      ...createTeacherDto,
      password: hashedPassword,
      verificationToken: token,
      role: existingRole,
      phoneNumber,
    });

    const newAccount = await this.userRepository.save(account);

    // Create teacher profile
    const teacherProfile = this.teacherProfileRepository.create({
      user: newAccount,
      teacherId: await this.generateTeacherId(),
      profilePicture: createTeacherDto.profilePicture,
      bio: createTeacherDto.bio,
      subjectsTaught: createTeacherDto.subjectsTaught,
      educationLevel: createTeacherDto.educationLevel,
      teachingExperience: createTeacherDto.teachingExperience,
      certifications: createTeacherDto.certifications,
      rating: '0',
      totalCourses: 0,
    });

    await this.teacherProfileRepository.save(teacherProfile);

    // Send verification email
    await this.mailService.sendUserConfirmation(newAccount, token, true);

    // Send welcome notification
    await this.notificationService.create({
      recipientId: newAccount.id,
      type: NotificationType.SMS,
      title: 'Welcome to Talenvo!',
      content: `Welcome ${newAccount.firstName}! Your teacher account has been created successfully. Your teacher ID is ${teacherProfile.teacherId}. Please verify your email to start creating courses.`,
      phoneNumber: newAccount.phoneNumber,
    });

    const { password, verificationToken, ...result } = newAccount;
    return result;
  }

  async create_Admin(createAdminDto: CreateAdminDto) {
    if (!createAdminDto.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await hash(createAdminDto.password, 10);

    const { existingRole, token, phoneNumber } =
      await this.validateAndPrepareUser(
        createAdminDto as CreateUserDto,
        'admin',
        createAdminDto.phoneNumber,
      );

    // Create user
    const account = this.userRepository.create({
      ...createAdminDto,
      password: hashedPassword,
      verificationToken: token,
      role: existingRole,
      phoneNumber,
    });

    const newAccount = await this.userRepository.save(account);

    // Create admin profile
    const adminProfile = this.adminProfileRepository.create({
      user: newAccount,
      adminId: await this.generateAdminId(),
      profilePicture: createAdminDto.profilePicture,
      lastLogin: new Date().toISOString(),
    });

    await this.adminProfileRepository.save(adminProfile);

    // Send verification email
    await this.mailService.sendUserConfirmation(newAccount, token, true);

    // Send welcome notification
    await this.notificationService.create({
      recipientId: newAccount.id,
      type: NotificationType.SMS,
      title: 'Welcome to Talenvo!',
      content: `Welcome ${newAccount.firstName}! Your admin account has been created successfully. Your admin ID is ${adminProfile.adminId}. Please verify your email to access the admin dashboard.`,
      phoneNumber: newAccount.phoneNumber,
    });

    const { password, verificationToken, ...result } = newAccount;
    return result;
  }

  async login(dto: LoginDto) {
    const account = await this.validateUser(dto);

    const payload = {
      email: account.email,
      sub: account.id,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET_KEY,
    });

    return { account, access_token };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const account = await this.userRepository.findOne({ where: { email } });
    if (!account) {
      throw new NotFoundException(`account with email ${email} not found`);
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    account.resetToken = resetToken;
    account.resetTokenExpiry = resetTokenExpiry;

    await this.userRepository.save(account);

    await this.mailService.sendPasswordResetEmail(account.email, resetToken);
    return { message: 'Reset link sent to verified email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, newPassword } = resetPasswordDto;
    const account = await this.userRepository.findOne({
      where: { email },
    });

    if (!account) {
      throw new ConflictException('Account does not exist');
    }

    if (account.isResetTokenVerified) {
      account.password = await hash(newPassword, 10);

      account.isResetTokenVerified = false;
      await this.userRepository.save(account);
    } else {
      throw new ConflictException('Reset token is not verified');
    }

    return { message: 'Password reset successfully' };
  }

  async verifyEmailToken(
    verifyEmailDto: VerifyEmailDto,
    email: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        verificationToken: verifyEmailDto.verificationToken,
        email: email,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    let savedUser: User = user;
    if (user) {
      user.isVerified = true;
      user.verificationToken = null;
      savedUser = await this.userRepository.save(user);
      if (savedUser) {
        await this.mailService.sendPasswordAfterVerifyingEmail(
          email,
          user,
          true,
        );
      }
    }
    return savedUser;
  }

  async verifyResetToken(resetTokenDto: ResetTokenDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        resetToken: resetTokenDto.reference,
        resetTokenExpiry: MoreThan(new Date()),
        email: resetTokenDto.email,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    let savedUser: User = user;
    if (user) {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      user.isResetTokenVerified = true;
      savedUser = await this.userRepository.save(user);
      if (savedUser) {
        await this.mailService.sendResetTokenConfirmation(
          resetTokenDto.email,
          user,
          true,
        );
      }
    }
    return savedUser;
  }

  // Helper methods --------------------------------------------------------------

  async findUserWithEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        address: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profileImage: true,
        password: true,
        status: true,
        isVerified: true,
        studentProfile: {
          studentId: true,
        },
        teacherProfile: {
          teacherId: true,
        },
        adminProfile: {
          adminId: true,
        },
      },
      relations: {
        role: true,
        studentProfile: true,
        teacherProfile: true,
        adminProfile: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async validateUser(dto: LoginDto) {
    const account = await this.findUserWithEmail(dto.email);

    if (!account) {
      throw new ConflictException(`Account does not exist`);
    }

    // Check if the user's account is active
    if (account.status !== 'active') {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Check if the user's email is verified
    if (!account.isVerified) {
      throw new UnauthorizedException(
        'Email is unverified. Please check your email for a verification link',
      );
    }

    // Validate the password

    const isPasswordValid = await compare(dto.password, account.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Exclude the password field from the result
    const { password, ...result } = account;
    return result;
  }

  async validateGoogleUser(email: string, displayName: string): Promise<User> {
    let account = await this.userRepository.findOne({ where: { email } });

    if (!account) {
      account = this.userRepository.create({
        email,
        firstName: displayName.split(' ')[0],
        lastName: displayName.split(' ').slice(1).join(' '),
      });
      await this.userRepository.save(account);
    }

    return account;
  }

  async generateJwtToken(user: User) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET_KEY,
    });
  }

  async validateAndPrepareUser(
    createUserDto: CreateUserDto,
    roleName: string,
    phoneNumber: string,
  ) {
    // Validate email
    if (!this.validateEmail(createUserDto.email)) {
      throw new EmailValidationException();
    }

    // Check if email is already in use
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
      withDeleted: true,
    });

    if (existingEmail) {
      if (existingEmail.deletedAt != null) {
        throw new ConflictException(
          `Email ${createUserDto.email} belonged to a deleted account`,
        );
      } else {
        throw new ConflictException(
          `Email ${createUserDto.email} is already in use`,
        );
      }
    }

    // Check if phone number is already in use
    const existingPhoneNumber = await this.userRepository.findOne({
      where: { phoneNumber },
      withDeleted: true,
    });

    if (existingPhoneNumber) {
      throw new ConflictException(
        `Phone number ${phoneNumber} is already in use`,
      );
    }

    // Find and validate role
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!existingRole) {
      throw new BadRequestException(`Role does not exist`);
    }

    // Generate verification token
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    return { existingRole, token, phoneNumber };
  }

  async validateEmail(email: string) {
    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
