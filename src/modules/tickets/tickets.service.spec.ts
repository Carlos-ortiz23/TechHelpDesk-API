import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';
import { CategoriesService } from '../categories/categories.service';
import { ClientsService } from '../clients/clients.service';
import { TechniciansService } from '../technicians/technicians.service';
import { TicketStatus } from '../../common/enums/ticket-status.enum';
import { TicketPriority } from '../../common/enums/ticket-priority.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepository: Repository<Ticket>;
  let categoriesService: CategoriesService;
  let clientsService: ClientsService;
  let techniciansService: TechniciansService;

  const mockTicketRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCategoriesService = {
    findOne: jest.fn(),
  };

  const mockClientsService = {
    findOne: jest.fn(),
  };

  const mockTechniciansService = {
    findOne: jest.fn(),
    validateCanAcceptTicket: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
        {
          provide: TechniciansService,
          useValue: mockTechniciansService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketRepository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    categoriesService = module.get<CategoriesService>(CategoriesService);
    clientsService = module.get<ClientsService>(ClientsService);
    techniciansService = module.get<TechniciansService>(TechniciansService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTicketDto: CreateTicketDto = {
      title: 'Test Ticket',
      description: 'Test Description',
      priority: TicketPriority.MEDIUM,
      categoryId: 'category-uuid',
      clientId: 'client-uuid',
    };

    const mockCategory = {
      id: 'category-uuid',
      name: 'Incidente de Hardware',
    };

    const mockClient = {
      id: 'client-uuid',
      name: 'Test Client',
    };

    const mockCreatedTicket = {
      id: 'ticket-uuid',
      ...createTicketDto,
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a ticket successfully', async () => {
      mockCategoriesService.findOne.mockResolvedValue(mockCategory);
      mockClientsService.findOne.mockResolvedValue(mockClient);
      mockTicketRepository.create.mockReturnValue(mockCreatedTicket);
      mockTicketRepository.save.mockResolvedValue(mockCreatedTicket);

      const result = await service.create(createTicketDto);

      expect(categoriesService.findOne).toHaveBeenCalledWith(createTicketDto.categoryId);
      expect(clientsService.findOne).toHaveBeenCalledWith(createTicketDto.clientId);
      expect(ticketRepository.create).toHaveBeenCalledWith(createTicketDto);
      expect(ticketRepository.save).toHaveBeenCalledWith(mockCreatedTicket);
      expect(result).toEqual(mockCreatedTicket);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockCategoriesService.findOne.mockRejectedValue(
        new NotFoundException('Categoría no encontrada'),
      );

      await expect(service.create(createTicketDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(categoriesService.findOne).toHaveBeenCalledWith(createTicketDto.categoryId);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      mockCategoriesService.findOne.mockResolvedValue(mockCategory);
      mockClientsService.findOne.mockRejectedValue(
        new NotFoundException('Cliente no encontrado'),
      );

      await expect(service.create(createTicketDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(clientsService.findOne).toHaveBeenCalledWith(createTicketDto.clientId);
    });

    it('should create ticket with technician and validate ticket limit', async () => {
      const dtoWithTechnician = {
        ...createTicketDto,
        technicianId: 'technician-uuid',
      };

      const mockTechnician = {
        id: 'technician-uuid',
        name: 'Test Technician',
      };

      mockCategoriesService.findOne.mockResolvedValue(mockCategory);
      mockClientsService.findOne.mockResolvedValue(mockClient);
      mockTechniciansService.findOne.mockResolvedValue(mockTechnician);
      mockTechniciansService.validateCanAcceptTicket.mockResolvedValue(undefined);
      mockTicketRepository.create.mockReturnValue({ ...mockCreatedTicket, ...dtoWithTechnician });
      mockTicketRepository.save.mockResolvedValue({ ...mockCreatedTicket, ...dtoWithTechnician });

      const result = await service.create(dtoWithTechnician);

      expect(techniciansService.findOne).toHaveBeenCalledWith(dtoWithTechnician.technicianId);
      expect(techniciansService.validateCanAcceptTicket).toHaveBeenCalledWith(dtoWithTechnician.technicianId);
      expect(result.technicianId).toEqual(dtoWithTechnician.technicianId);
    });

    it('should throw BadRequestException when technician has 5 tickets in progress', async () => {
      const dtoWithTechnician = {
        ...createTicketDto,
        technicianId: 'technician-uuid',
      };

      mockCategoriesService.findOne.mockResolvedValue(mockCategory);
      mockClientsService.findOne.mockResolvedValue(mockClient);
      mockTechniciansService.findOne.mockResolvedValue({ id: 'technician-uuid' });
      mockTechniciansService.validateCanAcceptTicket.mockRejectedValue(
        new BadRequestException('El técnico ya tiene 5 tickets en progreso'),
      );

      await expect(service.create(dtoWithTechnician)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    const mockTicket = {
      id: 'ticket-uuid',
      title: 'Test Ticket',
      description: 'Test Description',
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      categoryId: 'category-uuid',
      clientId: 'client-uuid',
      technicianId: 'technician-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update status from OPEN to IN_PROGRESS', async () => {
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.IN_PROGRESS,
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTechniciansService.validateCanAcceptTicket.mockResolvedValue(undefined);
      mockTicketRepository.update.mockResolvedValue({ affected: 1 });
      mockTicketRepository.findOne.mockResolvedValueOnce(mockTicket);
      mockTicketRepository.findOne.mockResolvedValueOnce({
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus('ticket-uuid', updateStatusDto);

      expect(ticketRepository.update).toHaveBeenCalledWith('ticket-uuid', {
        status: TicketStatus.IN_PROGRESS,
      });
    });

    it('should update status from IN_PROGRESS to RESOLVED', async () => {
      const ticketInProgress = { ...mockTicket, status: TicketStatus.IN_PROGRESS };
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.RESOLVED,
      };

      mockTicketRepository.findOne.mockResolvedValueOnce(ticketInProgress);
      mockTicketRepository.update.mockResolvedValue({ affected: 1 });
      mockTicketRepository.findOne.mockResolvedValueOnce({
        ...ticketInProgress,
        status: TicketStatus.RESOLVED,
      });

      await service.updateStatus('ticket-uuid', updateStatusDto);

      expect(ticketRepository.update).toHaveBeenCalledWith('ticket-uuid', {
        status: TicketStatus.RESOLVED,
      });
    });

    it('should update status from RESOLVED to CLOSED', async () => {
      const ticketResolved = { ...mockTicket, status: TicketStatus.RESOLVED };
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.CLOSED,
      };

      mockTicketRepository.findOne.mockResolvedValueOnce(ticketResolved);
      mockTicketRepository.update.mockResolvedValue({ affected: 1 });
      mockTicketRepository.findOne.mockResolvedValueOnce({
        ...ticketResolved,
        status: TicketStatus.CLOSED,
      });

      await service.updateStatus('ticket-uuid', updateStatusDto);

      expect(ticketRepository.update).toHaveBeenCalledWith('ticket-uuid', {
        status: TicketStatus.CLOSED,
      });
    });

    it('should throw BadRequestException when trying to skip status (OPEN to RESOLVED)', async () => {
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.RESOLVED,
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      await expect(
        service.updateStatus('ticket-uuid', updateStatusDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to go backwards (IN_PROGRESS to OPEN)', async () => {
      const ticketInProgress = { ...mockTicket, status: TicketStatus.IN_PROGRESS };
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.OPEN,
      };

      mockTicketRepository.findOne.mockResolvedValue(ticketInProgress);

      await expect(
        service.updateStatus('ticket-uuid', updateStatusDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when status is already the same', async () => {
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.OPEN,
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      await expect(
        service.updateStatus('ticket-uuid', updateStatusDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('ticket-uuid', updateStatusDto),
      ).rejects.toThrow('El ticket ya se encuentra en estado "open"');
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.IN_PROGRESS,
      };

      mockTicketRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent-uuid', updateStatusDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate technician can accept ticket when changing to IN_PROGRESS', async () => {
      const updateStatusDto: UpdateTicketStatusDto = {
        status: TicketStatus.IN_PROGRESS,
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);
      mockTechniciansService.validateCanAcceptTicket.mockResolvedValue(undefined);
      mockTicketRepository.update.mockResolvedValue({ affected: 1 });
      mockTicketRepository.findOne.mockResolvedValueOnce(mockTicket);
      mockTicketRepository.findOne.mockResolvedValueOnce({
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
      });

      await service.updateStatus('ticket-uuid', updateStatusDto);

      expect(techniciansService.validateCanAcceptTicket).toHaveBeenCalledWith(
        mockTicket.technicianId,
      );
    });
  });

  describe('findOne', () => {
    it('should return a ticket when found', async () => {
      const mockTicket = {
        id: 'ticket-uuid',
        title: 'Test Ticket',
      };

      mockTicketRepository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findOne('ticket-uuid');

      expect(result).toEqual(mockTicket);
      expect(ticketRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-uuid' },
        relations: ['category', 'client', 'technician'],
      });
    });

    it('should throw NotFoundException when ticket is not found', async () => {
      mockTicketRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
