import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ClientsService } from '../clients/clients.service';
import { Role } from '../../common/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let clientsService: ClientsService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockClientsService = {
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    clientsService = module.get<ClientsService>(ClientsService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user without password when credentials are valid', async () => {
      const mockUser = {
        id: 'user-uuid',
        name: 'Test User',
        email,
        password: 'hashedPassword',
        role: Role.CLIENT,
        isActive: true,
      };

      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive,
      });
      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(usersService.validatePassword).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const mockUser = {
        id: 'user-uuid',
        email,
        password: 'hashedPassword',
        isActive: false,
      };

      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUser = {
        id: 'user-uuid',
        email,
        password: 'hashedPassword',
        isActive: true,
      };

      mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return user and access token on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-uuid',
        name: 'Test User',
        email: loginDto.email,
        role: Role.CLIENT,
        isActive: true,
      };

      const mockToken = 'jwt-token';

      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
      });
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
        accessToken: mockToken,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('register', () => {
    const registerDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      company: 'Test Company',
      phone: '+1234567890',
    };

    it('should register a new user and return token', async () => {
      const mockCreatedUser = {
        id: 'new-user-uuid',
        name: registerDto.name,
        email: registerDto.email,
        role: Role.CLIENT,
      };

      const mockToken = 'jwt-token';

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);
      mockClientsService.create.mockResolvedValue({ id: 'client-uuid' });
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: {
          id: mockCreatedUser.id,
          name: mockCreatedUser.name,
          email: mockCreatedUser.email,
          role: mockCreatedUser.role,
        },
        accessToken: mockToken,
      });
      expect(usersService.create).toHaveBeenCalledWith({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
        role: Role.CLIENT,
      });
      expect(clientsService.create).toHaveBeenCalledWith({
        name: registerDto.name,
        contactEmail: registerDto.email,
        company: registerDto.company,
        phone: registerDto.phone,
        userId: mockCreatedUser.id,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'user-uuid';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: Role.CLIENT,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });
  });
});
