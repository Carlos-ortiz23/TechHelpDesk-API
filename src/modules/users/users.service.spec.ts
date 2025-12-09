import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: Role.CLIENT,
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-uuid',
        ...createUserDto,
        password: hashedPassword,
      };

      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: 'user-uuid',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto = {
      name: 'Updated Name',
    };

    it('should update user successfully', async () => {
      const existingUser = {
        id: 'user-uuid',
        name: 'Original Name',
        email: 'test@example.com',
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('user-uuid', updateUserDto);

      expect(mockRepository.update).toHaveBeenCalledWith('user-uuid', updateUserDto);
      expect(result.name).toEqual(updateUserDto.name);
    });

    it('should hash password when updating password', async () => {
      const updateDto = { password: 'newPassword123' };
      const hashedPassword = 'hashedNewPassword';
      const existingUser = {
        id: 'user-uuid',
        email: 'test@example.com',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ ...existingUser, password: hashedPassword });
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.update('user-uuid', updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingUser = {
        id: 'user-uuid',
        email: 'original@example.com',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other-user', email: 'taken@example.com' });

      await expect(
        service.update('user-uuid', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const mockUser = {
        id: 'user-uuid',
        name: 'Test User',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      await service.remove('user-uuid');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validatePassword', () => {
    it('should return true when password is valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword('password', 'hashedPassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
    });

    it('should return false when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword('wrongPassword', 'hashedPassword');

      expect(result).toBe(false);
    });
  });
});
