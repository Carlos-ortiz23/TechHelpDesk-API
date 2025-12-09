import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technician } from './entities/technician.entity';
import { CreateTechnicianDto, UpdateTechnicianDto } from './dto';
import { TicketStatus } from '../../common/enums/ticket-status.enum';

@Injectable()
export class TechniciansService {
  private readonly MAX_IN_PROGRESS_TICKETS = 5;

  constructor(
    @InjectRepository(Technician)
    private readonly technicianRepository: Repository<Technician>,
  ) {}

  async create(createTechnicianDto: CreateTechnicianDto): Promise<Technician> {
    const technician = this.technicianRepository.create(createTechnicianDto);
    return this.technicianRepository.save(technician);
  }

  async findAll(): Promise<Technician[]> {
    return this.technicianRepository.find({
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findAllActive(): Promise<Technician[]> {
    return this.technicianRepository.find({
      where: { isActive: true },
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findAllAvailable(): Promise<Technician[]> {
    return this.technicianRepository.find({
      where: { isActive: true, availability: true },
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Technician> {
    const technician = await this.technicianRepository.findOne({
      where: { id },
      relations: ['user', 'tickets'],
    });

    if (!technician) {
      throw new NotFoundException(`Técnico con ID ${id} no encontrado`);
    }

    return technician;
  }

  async findByUserId(userId: string): Promise<Technician | null> {
    return this.technicianRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(
    id: string,
    updateTechnicianDto: UpdateTechnicianDto,
  ): Promise<Technician> {
    await this.findOne(id);
    await this.technicianRepository.update(id, updateTechnicianDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const technician = await this.findOne(id);
    await this.technicianRepository.remove(technician);
  }

  async countInProgressTickets(technicianId: string): Promise<number> {
    const technician = await this.technicianRepository.findOne({
      where: { id: technicianId },
      relations: ['tickets'],
    });

    if (!technician) {
      throw new NotFoundException(`Técnico con ID ${technicianId} no encontrado`);
    }

    return technician.tickets.filter(
      (ticket) => ticket.status === TicketStatus.IN_PROGRESS,
    ).length;
  }

  async canAcceptMoreTickets(technicianId: string): Promise<boolean> {
    const inProgressCount = await this.countInProgressTickets(technicianId);
    return inProgressCount < this.MAX_IN_PROGRESS_TICKETS;
  }

  async validateCanAcceptTicket(technicianId: string): Promise<void> {
    const canAccept = await this.canAcceptMoreTickets(technicianId);
    if (!canAccept) {
      throw new BadRequestException(
        `El técnico ya tiene ${this.MAX_IN_PROGRESS_TICKETS} tickets en progreso. No puede aceptar más tickets.`,
      );
    }
  }
}
