import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
  AssignTechnicianDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { ClientsService } from '../clients/clients.service';
import { TechniciansService } from '../technicians/technicians.service';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly clientsService: ClientsService,
    private readonly techniciansService: TechniciansService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.CLIENT)
  @ApiOperation({ summary: 'Crear un nuevo ticket (Admin y Cliente)' })
  @ApiResponse({
    status: 201,
    description: 'Ticket creado exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'No funciona la impresora',
          description: 'La impresora HP del departamento de ventas no imprime',
          status: 'open',
          priority: 'medium',
          categoryId: '123e4567-e89b-12d3-a456-426614174001',
          clientId: '123e4567-e89b-12d3-a456-426614174002',
          technicianId: null,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        message: 'Operación exitosa',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Categoría o cliente no encontrado' })
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: any,
  ) {
    // If user is a client, they can only create tickets for themselves
    if (user.role === Role.CLIENT) {
      const client = await this.clientsService.findByUserId(user.id);
      if (!client) {
        throw new ForbiddenException('No tiene un perfil de cliente asociado');
      }
      createTicketDto.clientId = client.id;
    }
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los tickets (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'No funciona la impresora',
            description: 'La impresora HP del departamento de ventas no imprime',
            status: 'open',
            priority: 'medium',
            category: { id: '...', name: 'Incidente de Hardware' },
            client: { id: '...', name: 'María García' },
            technician: null,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
        ],
        message: 'Operación exitosa',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get('my-tickets')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Obtener tickets del cliente autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Historial de tickets del cliente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findMyTickets(@CurrentUser() user: any) {
    const client = await this.clientsService.findByUserId(user.id);
    if (!client) {
      throw new ForbiddenException('No tiene un perfil de cliente asociado');
    }
    return this.ticketsService.findByClient(client.id);
  }

  @Get('assigned')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener tickets asignados al técnico autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets asignados al técnico',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findAssignedTickets(@CurrentUser() user: any) {
    const technician = await this.techniciansService.findByUserId(user.id);
    if (!technician) {
      throw new ForbiddenException('No tiene un perfil de técnico asociado');
    }
    return this.ticketsService.findByTechnician(technician.id);
  }

  @Get('client/:id')
  @Roles(Role.ADMIN, Role.CLIENT)
  @ApiOperation({ summary: 'Obtener historial de tickets por cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID del cliente (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de tickets del cliente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findByClient(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    // If user is a client, they can only see their own tickets
    if (user.role === Role.CLIENT) {
      const client = await this.clientsService.findByUserId(user.id);
      if (!client || client.id !== id) {
        throw new ForbiddenException('Solo puede ver sus propios tickets');
      }
    }
    return this.ticketsService.findByClient(id);
  }

  @Get('technician/:id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener tickets por técnico' })
  @ApiParam({
    name: 'id',
    description: 'ID del técnico (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets asignados al técnico',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Técnico no encontrado' })
  async findByTechnician(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    // If user is a technician, they can only see their own assigned tickets
    if (user.role === Role.TECHNICIAN) {
      const technician = await this.techniciansService.findByUserId(user.id);
      if (!technician || technician.id !== id) {
        throw new ForbiddenException('Solo puede ver sus tickets asignados');
      }
    }
    return this.ticketsService.findByTechnician(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.CLIENT)
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del ticket (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket encontrado',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const ticket = await this.ticketsService.findOne(id);

    // Check permissions based on role
    if (user.role === Role.CLIENT) {
      const client = await this.clientsService.findByUserId(user.id);
      if (!client || ticket.clientId !== client.id) {
        throw new ForbiddenException('No tiene acceso a este ticket');
      }
    } else if (user.role === Role.TECHNICIAN) {
      const technician = await this.techniciansService.findByUserId(user.id);
      if (!technician || ticket.technicianId !== technician.id) {
        throw new ForbiddenException('No tiene acceso a este ticket');
      }
    }

    return ticket;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un ticket (Solo Admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID del ticket (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Cambiar estado del ticket (Admin y Técnico)' })
  @ApiParam({
    name: 'id',
    description: 'ID del ticket (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del ticket actualizado exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'No funciona la impresora',
          status: 'in_progress',
          updatedAt: '2024-01-15T11:00:00Z',
        },
        message: 'Operación exitosa',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado inválida',
    schema: {
      example: {
        success: false,
        data: null,
        message: 'Transición de estado inválida. El estado actual es "open" y solo puede cambiar a "in_progress".',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
    @CurrentUser() user: any,
  ) {
    // If technician, validate they own the ticket
    if (user.role === Role.TECHNICIAN) {
      const technician = await this.techniciansService.findByUserId(user.id);
      if (!technician) {
        throw new ForbiddenException('No tiene un perfil de técnico asociado');
      }
      const ownsTicket = await this.ticketsService.validateTechnicianOwnsTicket(
        id,
        technician.id,
      );
      if (!ownsTicket) {
        throw new ForbiddenException('Solo puede actualizar tickets asignados a usted');
      }
    }

    return this.ticketsService.updateStatus(id, updateTicketStatusDto, user.id, user.role);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Asignar técnico a un ticket (Solo Admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID del ticket (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Técnico asignado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'El técnico ya tiene 5 tickets en progreso' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Ticket o técnico no encontrado' })
  assignTechnician(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTechnicianDto: AssignTechnicianDto,
  ) {
    return this.ticketsService.assignTechnician(id, assignTechnicianDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un ticket (Solo Admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID del ticket (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket eliminado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.remove(id);
  }
}
