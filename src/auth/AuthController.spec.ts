import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './AuthController';
import { AuthService } from './AuthService';
import { Role } from '../users/enum/RoleEnum';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockUser = {
    _id: 'abc123',
    email: 'user@warehouse.com',
    role: Role.User,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('validates credentials and returns an access token', async () => {
    service.validateUser.mockResolvedValue(mockUser as any);
    service.login.mockReturnValue({ accessToken: 'signed.jwt.token' });

    const result = await controller.login({
      email: 'user@warehouse.com',
      password: 'password123',
    });

    expect(service.validateUser).toHaveBeenCalledWith(
      'user@warehouse.com',
      'password123',
    );
    expect(service.login).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({ accessToken: 'signed.jwt.token' });
  });
});
