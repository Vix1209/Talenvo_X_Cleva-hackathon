import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { paginate } from 'utils/pagination.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
