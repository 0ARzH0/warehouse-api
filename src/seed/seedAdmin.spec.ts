import { seedAdmin } from './seedAdmin';
import { UsersService } from '../users/UsersService';
import { Role } from '../users/enum/RoleEnum';

describe('seedAdmin', () => {
  let usersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;
  });

  it('creates an admin user when none exists with that email', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await seedAdmin(usersService, 'admin@warehouse.com', 'AdminPass123');
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'admin@warehouse.com',
      password: 'AdminPass123',
      role: Role.Admin,
    });
  });

  it('skips creation when a user with that email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ _id: 'existing' } as any);
    await seedAdmin(usersService, 'admin@warehouse.com', 'AdminPass123');
    expect(usersService.create).not.toHaveBeenCalled();
  });
});
