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
import { CreateJudgeDto, CreateUserDto } from './dto/create-account.dto';
import { MailService } from 'src/mail/mail.service';
import { Role } from 'src/(resources)/role/entities/role.entity';
import { CloudinaryUploadService } from 'src/cloudinary/cloudinaryUpload.service';

import { EmailValidationException } from 'utils';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import {
  Contestant,
  Admin,
  Voter,
  Judge,
} from 'src/(resources)/users/entities/user-profile.entity';
import {
  CreateAdminDto,
  CreateContestantDto,
  CreateVoterDto,
} from './dto/create-account.dto';
import { ResetTokenDto } from './dto/reset-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectRepository(Voter)
    private readonly voterRepository: Repository<Voter>,

    @InjectRepository(Judge)
    private readonly judgeRepository: Repository<Judge>,

    @InjectRepository(Contestant)
    private readonly contestantRepository: Repository<Contestant>,

    private jwtService: JwtService,
    private mailService: MailService,
    private cloudinaryUploadService: CloudinaryUploadService,
  ) {}

  private readonly contestant_password = process.env.CONTESTANT_PASSWORD;

  async create_Voter(createVoterDto: CreateVoterDto) {
    if (!createVoterDto.password) {
      throw new BadRequestException('Password is required');
    }
    // Hash password
    if (!createVoterDto.password) {
      throw new BadRequestException('Password is required');
    }
    const hashedPassword = await hash(createVoterDto.password, 10);

    const { existingRole, token } = await this.validateAndPrepareUser(
      createVoterDto as CreateUserDto,
      'voter',
    );

    // Create user
    const account = this.userRepository.create({
      ...createVoterDto,
      password: hashedPassword,
      verificationToken: token,
      role: existingRole,
    });

    const newAccount = await this.userRepository.save(account);

    // Create voter profile
    const voterProfile = this.voterRepository.create({
      user: newAccount,
      votesCast: 0, // Look into this
      votingHistory: [], // Look into this
      voterLevel: 1, // Look into this
    });

    const savedProfile = await this.voterRepository.save(voterProfile);

    // Update user with profile reference
    newAccount.voterProfile = savedProfile;
    await this.userRepository.save(newAccount);

    // Send confirmation email
    await this.mailService.sendAuthEmailConfirmation(
      createVoterDto,
      true,
      token,
    );

    return {
      id: newAccount.id,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      email: newAccount.email,
      phoneNumber: newAccount.phoneNumber,
      role: {
        id: newAccount.role.id,
        name: newAccount.role.name,
      },
      status: newAccount.status,
      profileType: 'voter',
      profile: savedProfile,
    };
  }

  async create_Contestant(
    createContestantDto: CreateContestantDto,
    profileImage: Express.Multer.File,
    portfolioImages: Express.Multer.File[],
  ) {
    const { existingRole, token } = await this.validateAndPrepareUser(
      createContestantDto as CreateUserDto,
      'contestant',
    );

    const unhashedPassword = String(this.contestant_password);

    // Hash password
    createContestantDto.password = await hash(unhashedPassword, 10);

    // Upload image to Cloudinary
    let imageUrl = '';
    if (profileImage) {
      const uploadResult = await this.cloudinaryUploadService.uploadFile(
        profileImage,
        'sketch2finish_Users',
      );

      imageUrl = uploadResult;
    } else {
      throw new NotFoundException('Profile image not included');
    }

    // Upload portfolio images if available
    const portfolioImageUrls: string[] = [];
    if (portfolioImages && portfolioImages.length > 0) {
      for (const Image of portfolioImages) {
        const uploadResult = await this.cloudinaryUploadService.uploadFile(
          Image,
          'sketch2finish_Portfolios',
        );
        portfolioImageUrls.push(uploadResult);
      }
    }

    // Create user
    const account = this.userRepository.create({
      ...createContestantDto,
      verificationToken: token,
      role: existingRole,
      profileImage: imageUrl,
      gender: createContestantDto.gender?.toLowerCase() as 'male' | 'female',
    });

    const newAccount = await this.userRepository.save(account);

    // Create contestant profile
    const contestantProfile = this.contestantRepository.create({
      user: newAccount,
      totalVotes: 0, // Look into this
    });

    const profile = await this.contestantRepository.save(contestantProfile);

    // Update user with profile reference
    if (newAccount) {
      newAccount.contestantProfile = profile;
      newAccount.contestantProfile.portfolioImages = portfolioImageUrls;
      newAccount.isVerified = true;
      newAccount.verificationToken = null;
      newAccount.status = 'inactive';
      await this.userRepository.save(newAccount);
    }
    // Send confirmation email
    await this.mailService.confirmContestantAccount(newAccount, true);

    return {
      id: newAccount.id,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      email: newAccount.email,
      phoneNumber: newAccount.phoneNumber,
      role: {
        id: newAccount.role.id,
        name: newAccount.role.name,
      },
      status: newAccount.status,
      profileType: 'contestant',
      profile,
    };
  }

  async create_Admin(createAdminDto: CreateAdminDto) {
    if (!createAdminDto.password) {
      throw new BadRequestException('Password is required');
    }

    // Hash password
    if (!createAdminDto.password) {
      throw new BadRequestException('Password is required');
    }
    const hashedPassword = await hash(createAdminDto.password, 10);

    const { existingRole, token } = await this.validateAndPrepareUser(
      createAdminDto as CreateUserDto,
      'admin',
    );

    createAdminDto.verificationToken = token;

    // Create user
    const account = this.userRepository.create({
      ...createAdminDto,
      password: hashedPassword,
      verificationToken: token,
      role: existingRole,
    });

    const newAccount = await this.userRepository.save(account);

    // Create admin profile
    const adminProfile = this.adminRepository.create({
      user: newAccount,
      permissions: ['view_leaderboard'], // Look into this
    });

    const savedProfile = await this.adminRepository.save(adminProfile);

    // Update user with profile reference
    newAccount.adminProfile = savedProfile;
    await this.userRepository.save(newAccount);

    // Send confirmation email
    await this.mailService.sendAuthEmailConfirmation(
      createAdminDto,
      true,
      token,
    );

    return {
      id: newAccount.id,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      email: newAccount.email,
      phoneNumber: newAccount.phoneNumber,
      role: {
        id: newAccount.role.id,
        name: newAccount.role.name,
      },
      status: newAccount.status,
      profileType: 'admin',
      profile: savedProfile,
    };
  }

  async create_Judge(createJudgeDto: CreateJudgeDto) {
    if (!createJudgeDto.password) {
      throw new BadRequestException('Password is required');
    }

    // Hash password
    if (!createJudgeDto.password) {
      throw new BadRequestException('Password is required');
    }
    const hashedPassword = await hash(createJudgeDto.password, 10);

    const { existingRole, token } = await this.validateAndPrepareUser(
      createJudgeDto,
      'judge',
    );

    // Create user
    const account = this.userRepository.create({
      ...createJudgeDto,
      password: hashedPassword,
      verificationToken: token,
      role: existingRole,
    });

    const newAccount = await this.userRepository.save(account);

    // Create judge profile
    const judgeProfile = this.judgeRepository.create({
      user: newAccount,
      casesReviewed: 0, // Look into this
      scoringHistory: [], // Look into this
      activeSeasons: 0, // Look into this
    });

    const savedProfile = await this.judgeRepository.save(judgeProfile);

    // Update user with profile reference
    newAccount.judgeProfile = savedProfile;
    await this.userRepository.save(newAccount);

    // Send confirmation email
    await this.mailService.sendAuthEmailConfirmation(
      createJudgeDto,
      true,
      token,
    );

    return {
      id: newAccount.id,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      email: newAccount.email,
      phoneNumber: newAccount.phoneNumber,
      role: {
        id: newAccount.role.id,
        name: newAccount.role.name,
      },
      status: newAccount.status,
      profileType: 'judge',
      profileId: savedProfile.id,
    };
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

    // const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
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
        voterProfile: {
          id: true,
        },
        contestantProfile: {
          id: true,
        },
        adminProfile: {
          id: true,
        },
        judgeProfile: {
          id: true,
        },
      },
      relations: [
        'role',
        'voterProfile',
        'contestantProfile',
        'adminProfile',
        'judgeProfile',
      ],
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

  async validateAndPrepareUser(createUserDto: CreateUserDto, roleName: string) {
    // Validate email
    if (!validateEmail(createUserDto.email)) {
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

    // Find and validate role
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!existingRole) {
      throw new BadRequestException(`Role does not exist`);
    }

    createUserDto.role = existingRole;

    // Generate verification token
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    return { existingRole, token };
  }
}

function validateEmail(email: string) {
  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
