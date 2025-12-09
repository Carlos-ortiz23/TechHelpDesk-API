import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const existingClient = await this.clientRepository.findOne({
      where: { contactEmail: createClientDto.contactEmail },
    });

    if (existingClient) {
      throw new ConflictException('Ya existe un cliente con ese correo de contacto');
    }

    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findAllActive(): Promise<Client[]> {
    return this.clientRepository.find({
      where: { isActive: true },
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user', 'tickets'],
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return client;
  }

  async findByUserId(userId: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    if (
      updateClientDto.contactEmail &&
      updateClientDto.contactEmail !== client.contactEmail
    ) {
      const existingClient = await this.clientRepository.findOne({
        where: { contactEmail: updateClientDto.contactEmail },
      });

      if (existingClient) {
        throw new ConflictException('Ya existe un cliente con ese correo de contacto');
      }
    }

    await this.clientRepository.update(id, updateClientDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }
}
