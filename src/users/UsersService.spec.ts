import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './UsersService';
import { User } from './schema/User.schema';
import { Role } from './enum/Role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let model: any;

  const mockUser = {
    _id: 'abc123',
    email: 'user@warehouse.com',
    password: 'hashed',
    role: Role.User,
  };

  beforeEach(async () => {
    const mockUserModel = {
      new: jest.fn().mockResolvedValue(mockUser),
      constructor: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get(getModelToken(User.name));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a user', async () => {
      model.create.mockResolvedValue(mockUser);
      const result = await service.create({
        email: 'user@warehouse.com',
        password: 'password123',
      });
      expect(model.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('throws ConflictException on duplicate email (E11000)', async () => {
      model.create.mockRejectedValue({ code: 11000 });
      await expect(
        service.create({ email: 'dup@warehouse.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockUser]),
      });
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('returns a user by id', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      const result = await service.findOne('abc123');
      expect(result).toEqual(mockUser);
    });

    it('throws NotFoundException when user does not exist', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns a user by email', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      const result = await service.findByEmail('user@warehouse.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    const doc = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(mockUser),
    };

    it('allows admin to update role and email', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      await service.update(
        'abc123',
        { email: 'new@warehouse.com', role: Role.Supervisor },
        { userId: 'admin-id', role: Role.Admin },
      );
      expect(doc.save).toHaveBeenCalled();
    });

    it('allows a user to update their own password', async () => {
      const selfDoc = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(selfDoc),
      });
      await service.update(
        'abc123',
        { password: 'newpassword123' },
        { userId: 'abc123', role: Role.User },
      );
      expect(selfDoc.save).toHaveBeenCalled();
    });

    it('throws ForbiddenException when a non-admin tries to change role/email', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      await expect(
        service.update(
          'abc123',
          { role: Role.Admin },
          { userId: 'abc123', role: Role.User },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when target user does not exist', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.update(
          'missing',
          { password: 'newpassword123' },
          {
            userId: 'missing',
            role: Role.User,
          },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException on duplicate email during update (E11000)', async () => {
      const failingDoc = {
        ...mockUser,
        save: jest.fn().mockRejectedValue({ code: 11000 }),
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(failingDoc),
      });
      await expect(
        service.update(
          'abc123',
          { email: 'dup@warehouse.com' },
          {
            userId: 'admin-id',
            role: Role.Admin,
          },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('removes a user', async () => {
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      await expect(service.remove('abc123')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when user does not exist', async () => {
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
