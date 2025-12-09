import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: Repository<Client>;

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
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repository = module.get<Repository<Client>>(getRepositoryToken(Client));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createClientDto = {
      name: 'Test Client',
      contactEmail: 'client@example.com',
      company: 'Test Company',
    };

    it('should create a client successfully', async () => {
      const mockClient = {
        id: 'client-uuid',
        ...createClientDto,
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockClient);
      mockRepository.save.mockResolvedValue(mockClient);

      const result = await service.create(createClientDto);

      expect(result).toEqual(mockClient);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-client' });

      await expect(service.create(createClientDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all clients', async () => {
      const mockClients = [
        { id: 'client-1', name: 'Client 1' },
        { id: 'client-2', name: 'Client 2' },
      ];

      mockRepository.find.mockResolvedValue(mockClients);

      const result = await service.findAll();

      expect(result).toEqual(mockClients);
    });
  });

  describe('findOne', () => {
    it('should return a client when found', async () => {
      const mockClient = {
        id: 'client-uuid',
        name: 'Test Client',
      };

      mockRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findOne('client-uuid');

      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return client by user ID', async () => {
      const mockClient = {
        id: 'client-uuid',
        userId: 'user-uuid',
      };

      mockRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findByUserId('user-uuid');

      expect(result).toEqual(mockClient);
    });
  });

  describe('update', () => {
    it('should update client successfully', async () => {
      const existingClient = {
        id: 'client-uuid',
        name: 'Original Name',
        contactEmail: 'original@example.com',
      };

      const updateDto = { name: 'Updated Name' };

      mockRepository.findOne
        .mockResolvedValueOnce(existingClient)
        .mockResolvedValueOnce({ ...existingClient, ...updateDto });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('client-uuid', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('client-uuid', updateDto);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingClient = {
        id: 'client-uuid',
        contactEmail: 'original@example.com',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingClient)
        .mockResolvedValueOnce({ id: 'other-client' });

      await expect(
        service.update('client-uuid', { contactEmail: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove client successfully', async () => {
      const mockClient = {
        id: 'client-uuid',
        name: 'Test Client',
      };

      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.remove.mockResolvedValue(mockClient);

      await service.remove('client-uuid');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockClient);
    });
  });
});
