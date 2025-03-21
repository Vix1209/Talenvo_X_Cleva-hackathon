import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { paginate } from 'utils/pagination.utils';
import { UpdatePasswordDto } from '../auth/dto/update-password.dto';
import { compare, hash } from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadService } from 'src/fileUpload/cloudinary/cloudinaryUpload.service';
import { Role } from '../role/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly cloudinaryUploadService: CloudinaryUploadService,
  ) {}

  async findAll({
    page,
    limit,
    search,
    role,
  }: {
    page?: number | 1;
    limit?: number | 10;
    search?: string;
    role?: string;
  }) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.teacherProfile', 'teacherProfile')
      .leftJoinAndSelect('user.studentProfile', 'studentProfile')
      .leftJoinAndSelect('user.adminProfile', 'adminProfile')
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      query.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      query.andWhere('role.name = :role', { role });
    }

    const [data, total] = await query.getManyAndCount();

    // Format response to return only the correct profile based on the role
    const formattedData = data.map((user) => {
      let profile: any = null;

      // Check if the role exists before trying to access its name
      if (user.role) {
        switch (user.role.name.toLowerCase()) {
          case 'teacher':
            profile = user.teacherProfile;
            break;
          case 'student':
            profile = user.studentProfile;
            break;
          case 'admin':
            profile = user.adminProfile;
            break;
        }
      }

      const { adminProfile, studentProfile, teacherProfile, ...details } = user;

      return {
        ...details,
        profile,
      };
    });

    return {
      ...paginate(formattedData, limit ?? 10, page ?? 1),
      total,
    };
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updatePassword(updatePasswordDTO: UpdatePasswordDto) {
    const { currentPassword, newPassword, email } = updatePasswordDTO;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Ensure currentPassword and user.password are defined
    if (!currentPassword || !user.password) {
      throw new BadRequestException('Current password is required');
    }

    // Compare currentPassword with the stored hashed password
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password strength (optional)
    if (newPassword.length < 8) {
      throw new BadRequestException(
        'New password must be at least 8 characters long',
      );
    }

    // Hash the new password and update the user's password
    user.password = await hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  // ------------------ Update Profile Image ------------------ //
  async updateProfileImage(id: string, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Delete the existing profile image if it exists
    try {
      if (user.profileImage) {
        const publicId = user.profileImage
          .split('/')
          .slice(-2)
          .join('/')
          .split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        user.profileImage = null;
      }

      // Upload new profile image using chunked upload
      const profileImageUrl = await this.cloudinaryUploadService.uploadFile(
        file,
        'EduliteUsers',
      );

      // Update the user's profile image URL in the database
      user.profileImage = profileImageUrl;
      await this.userRepository.save(user);

      return {
        status: 'success',
        profileImage: profileImageUrl,
        message: 'Profile image updated successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update profile image: ${error.message}`,
      );
    }
  }

  async toggleAccountStatus(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status == 'active') {
      user.status = 'inactive';
    } else {
      user.status = 'active';
    }

    await this.userRepository.save(user);

    return {
      message: `${user.status == 'active' ? `${user.firstName}'s account activated successfully` : `${user.firstName}'s account deactivated successfully`}`,
    };
  }

  async deleteAccount(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['role', 'teacherProfile', 'studentProfile', 'adminProfile'],
    });
    if (!user) {
      throw new ConflictException(`User with id ${id} does not exist`);
    }

    // Soft delete all attendance records
    await this.userRepository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id', { id })
      .execute();

    await this.userRepository.softDelete(id);
    return { message: `Account deleted successfully` };
  }

  async restoreAccount(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) {
      throw new ConflictException(`User with id ${id} does not exist`);
    }

    await this.userRepository.recover(user);
    return { message: `Account restored successfully` };
  }
}
