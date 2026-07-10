import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './UsersController';
import { UsersService } from './UsersService';
import { Role } from './enum/RoleEnum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser = {
    _id: 'abc123',
    email: 'user@warehouse.com',
    role: Role.User,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('creates a user', async () => {
    service.create.mockResolvedValue(mockUser as any);
    const result = await controller.create({
      email: 'user@warehouse.com',
      password: 'password123',
    });
    expect(service.create).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it('lists all users', async () => {
    service.findAll.mockResolvedValue([mockUser] as any);
    const result = await controller.findAll();
    expect(result).toEqual([mockUser]);
  });

  it('returns a single user', async () => {
    service.findOne.mockResolvedValue(mockUser as any);
    const result = await controller.findOne('abc123');
    expect(service.findOne).toHaveBeenCalledWith('abc123');
    expect(result).toEqual(mockUser);
  });

  it('updates a user, forwarding the requesting user', async () => {
    service.update.mockResolvedValue(mockUser as any);
    const req = { user: { userId: 'abc123', role: Role.User } };
    const result = await controller.update(
      'abc123',
      { password: 'newpassword123' },
      req as any,
    );
    expect(service.update).toHaveBeenCalledWith(
      'abc123',
      { password: 'newpassword123' },
      req.user,
    );
    expect(result).toEqual(mockUser);
  });

  it('removes a user', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('abc123');
    expect(service.remove).toHaveBeenCalledWith('abc123');
  });
});
