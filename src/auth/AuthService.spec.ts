import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './AuthService';
import { UsersService } from '../users/UsersService';
import { Role } from '../users/enum/RoleEnum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const hashed = bcrypt.hashSync('password123', 10);
  const mockUser = {
    _id: 'abc123',
    email: 'user@warehouse.com',
    password: hashed,
    role: Role.User,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('returns the user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      const result = await service.validateUser(
        'user@warehouse.com',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('missing@warehouse.com', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(
        service.validateUser('user@warehouse.com', 'wrongpassword'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('signs and returns an access token', () => {
      jwtService.sign.mockReturnValue('signed.jwt.token');
      const result = service.login(mockUser as any);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    });
  });
});
