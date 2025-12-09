import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { Technician } from './entities/technician.entity';
import { TicketStatus } from '../../common/enums/ticket-status.enum';

describe('TechniciansService', () => {
  let service: TechniciansService;
  let repository: Repository<Technician>;

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
        TechniciansService,
        {
          provide: getRepositoryToken(Technician),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TechniciansService>(TechniciansService);
    repository = module.get<Repository<Technician>>(getRepositoryToken(Technician));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a technician successfully', async () => {
      const createTechnicianDto = {
        name: 'Test Technician',
        specialty: 'Hardware',
      };

      const mockTechnician = {
        id: 'technician-uuid',
        ...createTechnicianDto,
        availability: true,
        isActive: true,
      };

      mockRepository.create.mockReturnValue(mockTechnician);
      mockRepository.save.mockResolvedValue(mockTechnician);

      const result = await service.create(createTechnicianDto);

      expect(result).toEqual(mockTechnician);
    });
  });

  describe('findAll', () => {
    it('should return all technicians', async () => {
      const mockTechnicians = [
        { id: 'tech-1', name: 'Tech 1' },
        { id: 'tech-2', name: 'Tech 2' },
      ];

      mockRepository.find.mockResolvedValue(mockTechnicians);

      const result = await service.findAll();

      expect(result).toEqual(mockTechnicians);
    });
  });

  describe('findAllAvailable', () => {
    it('should return only available technicians', async () => {
      const mockTechnicians = [
        { id: 'tech-1', name: 'Tech 1', availability: true, isActive: true },
      ];

      mockRepository.find.mockResolvedValue(mockTechnicians);

      const result = await service.findAllAvailable();

      expect(result).toEqual(mockTechnicians);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, availability: true },
        relations: ['user'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a technician when found', async () => {
      const mockTechnician = {
        id: 'technician-uuid',
        name: 'Test Technician',
      };

      mockRepository.findOne.mockResolvedValue(mockTechnician);

      const result = await service.findOne('technician-uuid');

      expect(result).toEqual(mockTechnician);
    });

    it('should throw NotFoundException when technician not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('countInProgressTickets', () => {
    it('should count tickets in progress', async () => {
      const mockTechnician = {
        id: 'technician-uuid',
        tickets: [
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.OPEN },
          { status: TicketStatus.RESOLVED },
        ],
      };

      mockRepository.findOne.mockResolvedValue(mockTechnician);

      const result = await service.countInProgressTickets('technician-uuid');

      expect(result).toBe(2);
    });

    it('should throw NotFoundException when technician not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.countInProgressTickets('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('canAcceptMoreTickets', () => {
    it('should return true when technician has less than 5 in-progress tickets', async () => {
      const mockTechnician = {
        id: 'technician-uuid',
        tickets: [
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
        ],
      };

      mockRepository.findOne.mockResolvedValue(mockTechnician);

      const result = await service.canAcceptMoreTickets('technician-uuid');

      expect(result).toBe(true);
    });

    it('should return false when technician has 5 in-progress tickets', async () => {
      const mockTechnician = {
        id: 'technician-uuid',
        tickets: [
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
        ],
      };

      mockRepository.findOne.mockResolvedValue(mockTechnician);

      const result = await service.canAcceptMoreTickets('technician-uuid');

      expect(result).toBe(false);
    });
  });

  describe('validateCanAcceptTicket', () => {
    it('should not throw when technician can accept more tickets', async () => {
      const mockTechnician = {
        id: 'technician-uuid',
        tickets: [{ status: TicketStatus.IN_PROGRESS }],
      };

      mockRepository.findOne.mockResolvedValue(mockTechnician);

      await expect(
        service.validateCanAcceptTicket('technician-uuid'),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException when technician has 5 in-progress tickets', async () => {
      const mockTechnician = {
        id: 'technician-uuid',
        tickets: [
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
          { status: TicketStatus.IN_PROGRESS },
        ],
      };

      mockRepository.findOne.mockResolvedValue(mockTechnician);

      await expect(
        service.validateCanAcceptTicket('technician-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update technician successfully', async () => {
      const existingTechnician = {
        id: 'technician-uuid',
        name: 'Original Name',
      };

      const updateDto = { name: 'Updated Name' };

      mockRepository.findOne
        .mockResolvedValueOnce(existingTechnician)
        .mockResolvedValueOnce({ ...existingTechnician, ...updateDto });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('technician-uuid', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('technician-uuid', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove technician successfully', async () => {
      const mockTechnician = {
        id: 'technician-uuid',
        name: 'Test Technician',
      };

      mockRepository.findOne.mockResolvedValue(mockTechnician);
      mockRepository.remove.mockResolvedValue(mockTechnician);

      await service.remove('technician-uuid');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTechnician);
    });
  });
});
