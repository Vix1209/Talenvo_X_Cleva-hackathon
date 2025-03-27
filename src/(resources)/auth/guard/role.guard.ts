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

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('No user or role found');
    }

    // Get the user's role name directly
    const userRoleName = user.role.name;

    if (!userRoleName) {
      throw new ForbiddenException('User role not found');
    }

    if (!requiredRoleNames.includes(userRoleName)) {
      throw new ForbiddenException(
        `Access denied! This route requires one of these roles: ${requiredRoleNames.join(', ')}`,
      );
    }

    return true;
  }
}
