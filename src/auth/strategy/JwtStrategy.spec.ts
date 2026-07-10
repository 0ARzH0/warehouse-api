import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './JwtStrategy';
import { Role } from '../../users/enum/RoleEnum';

describe('JwtStrategy', () => {
  const previousSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = previousSecret;
  });

  it('returns the request user for a valid payload', () => {
    const strategy = new JwtStrategy();
    const result = strategy.validate({
      sub: 'abc123',
      email: 'user@warehouse.com',
      role: Role.User,
    });
    expect(result).toEqual({
      userId: 'abc123',
      email: 'user@warehouse.com',
      role: Role.User,
    });
  });

  it('throws UnauthorizedException for an incomplete payload', () => {
    const strategy = new JwtStrategy();
    expect(() => strategy.validate({} as any)).toThrow(UnauthorizedException);
  });
});
