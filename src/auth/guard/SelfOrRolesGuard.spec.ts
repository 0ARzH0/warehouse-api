import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SelfOrRolesGuard } from './SelfOrRolesGuard';
import { Role } from '../../users/enum/RoleEnum';

describe('SelfOrRolesGuard', () => {
  let guard: SelfOrRolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const contextFor = (
    userId: string,
    role: Role,
    paramId: string,
  ): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId, role }, params: { id: paramId } }),
      }),
    } as any);

  beforeEach(() => {
    reflector = { get: jest.fn() } as any;
    guard = new SelfOrRolesGuard(reflector);
  });

  it('allows access when the user role satisfies the required roles', () => {
    reflector.get.mockReturnValue([Role.Admin]);
    expect(
      guard.canActivate(contextFor('admin-id', Role.Admin, 'other-id')),
    ).toBe(true);
  });

  it('allows access when the caller is accessing their own record', () => {
    reflector.get.mockReturnValue([Role.Admin]);
    expect(guard.canActivate(contextFor('user-id', Role.User, 'user-id'))).toBe(
      true,
    );
  });

  it('denies access when the role does not satisfy and it is not the own record', () => {
    reflector.get.mockReturnValue([Role.Admin]);
    expect(
      guard.canActivate(contextFor('user-id', Role.User, 'other-id')),
    ).toBe(false);
  });
});
