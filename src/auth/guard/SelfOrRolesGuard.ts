import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/Roles.decorator';
import { Role } from '../../users/enum/Role.enum';

@Injectable()
export class SelfOrRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<Role[]>(ROLES_KEY, context.getHandler()) ?? [];
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    if (requiredRoles.includes(user?.role)) return true;
    return params.id === user?.userId;
  }
}
