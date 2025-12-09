import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import {
  CreateTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
  AssignTechnicianDto,
} from './dto';
import { CategoriesService } from '../categories/categories.service';
import { ClientsService } from '../clients/clients.service';
import { TechniciansService } from '../technicians/technicians.service';
import {
  TicketStatus,
  TICKET_STATUS_ORDER,
} from '../../common/enums/ticket-status.enum';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly categoriesService: CategoriesService,
    private readonly clientsService: ClientsService,
    private readonly techniciansService: TechniciansService,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // Validate category exists
    await this.categoriesService.findOne(createTicketDto.categoryId);

    // Validate client exists
    await this.clientsService.findOne(createTicketDto.clientId);

    // If technician is provided, validate and check ticket limit
    if (createTicketDto.technicianId) {
      await this.techniciansService.findOne(createTicketDto.technicianId);
      await this.techniciansService.validateCanAcceptTicket(
        createTicketDto.technicianId,
      );
    }

    const ticket = this.ticketRepository.create(createTicketDto);
    return this.ticketRepository.save(ticket);
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      relations: ['category', 'client', 'technician'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['category', 'client', 'technician'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    return ticket;
  }

  async findByClient(clientId: string): Promise<Ticket[]> {
    // Validate client exists
    await this.clientsService.findOne(clientId);

    return this.ticketRepository.find({
      where: { clientId },
      relations: ['category', 'client', 'technician'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTechnician(technicianId: string): Promise<Ticket[]> {
    // Validate technician exists
    await this.techniciansService.findOne(technicianId);

    return this.ticketRepository.find({
      where: { technicianId },
      relations: ['category', 'client', 'technician'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);

    // Validate category if provided
    if (updateTicketDto.categoryId) {
      await this.categoriesService.findOne(updateTicketDto.categoryId);
    }

    // Validate technician if provided
    if (updateTicketDto.technicianId) {
      await this.techniciansService.findOne(updateTicketDto.technicianId);
      
      // Only validate ticket limit if technician is being changed
      if (updateTicketDto.technicianId !== ticket.technicianId) {
        await this.techniciansService.validateCanAcceptTicket(
          updateTicketDto.technicianId,
        );
      }
    }

    await this.ticketRepository.update(id, updateTicketDto);
    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    updateTicketStatusDto: UpdateTicketStatusDto,
    userId?: string,
    userRole?: Role,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const newStatus = updateTicketStatusDto.status;

    // Validate status transition
    this.validateStatusTransition(ticket.status, newStatus);

    // If changing to IN_PROGRESS, validate technician can accept
    if (
      newStatus === TicketStatus.IN_PROGRESS &&
      ticket.technicianId
    ) {
      // Only validate if current status is not already IN_PROGRESS
      if (ticket.status !== TicketStatus.IN_PROGRESS) {
        await this.techniciansService.validateCanAcceptTicket(ticket.technicianId);
      }
    }

    await this.ticketRepository.update(id, { status: newStatus });
    return this.findOne(id);
  }

  async assignTechnician(
    id: string,
    assignTechnicianDto: AssignTechnicianDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const technician = await this.techniciansService.findOne(
      assignTechnicianDto.technicianId,
    );

    // Validate technician can accept more tickets
    await this.techniciansService.validateCanAcceptTicket(technician.id);

    await this.ticketRepository.update(id, {
      technicianId: assignTechnicianDto.technicianId,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  private validateStatusTransition(
    currentStatus: TicketStatus,
    newStatus: TicketStatus,
  ): void {
    if (currentStatus === newStatus) {
      throw new BadRequestException(
        `El ticket ya se encuentra en estado "${currentStatus}"`,
      );
    }

    const currentIndex = TICKET_STATUS_ORDER.indexOf(currentStatus);
    const newIndex = TICKET_STATUS_ORDER.indexOf(newStatus);

    // Only allow moving forward one step at a time
    if (newIndex !== currentIndex + 1) {
      const validNextStatus = TICKET_STATUS_ORDER[currentIndex + 1];
      throw new BadRequestException(
        `Transición de estado inválida. El estado actual es "${currentStatus}" y solo puede cambiar a "${validNextStatus}". ` +
          `La secuencia válida es: Abierto → En progreso → Resuelto → Cerrado`,
      );
    }
  }

  async validateTechnicianOwnsTicket(
    ticketId: string,
    technicianId: string,
  ): Promise<boolean> {
    const ticket = await this.findOne(ticketId);
    return ticket.technicianId === technicianId;
  }

  async validateClientOwnsTicket(
    ticketId: string,
    clientId: string,
  ): Promise<boolean> {
    const ticket = await this.findOne(ticketId);
    return ticket.clientId === clientId;
  }
}
