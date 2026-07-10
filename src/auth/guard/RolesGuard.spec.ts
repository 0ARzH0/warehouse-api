import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './RolesGuard';
import { Role } from '../../users/enum/RoleEnum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const contextFor = (role?: Role): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    } as any);

  beforeEach(() => {
    reflector = { get: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.get.mockReturnValue(undefined);
    expect(guard.canActivate(contextFor(Role.User))).toBe(true);
  });

  it('allows access when the user role is in the required list', () => {
    reflector.get.mockReturnValue([Role.Admin, Role.Supervisor]);
    expect(guard.canActivate(contextFor(Role.Admin))).toBe(true);
  });

  it('denies access when the user role is not in the required list', () => {
    reflector.get.mockReturnValue([Role.Admin]);
    expect(guard.canActivate(contextFor(Role.User))).toBe(false);
  });
});
