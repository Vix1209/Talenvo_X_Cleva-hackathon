import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/(resources)/role/entities/role.entity';
import { User } from 'src/(resources)/users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoleNames = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoleNames) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Get the user's role from the database
    const userRole = await this.roleRepository.findOne({
      where: { id: user.role.name },
    });

    if (!userRole) {
      return false;
    }

    if (!requiredRoleNames.includes(userRole.name)) {
      throw new ForbiddenException(`Access denied! Unauthorized entry!`);
    }

    return true;
  }
}
