import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TicketPriority } from '../../../common/enums/ticket-priority.enum';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Título del ticket',
    example: 'No funciona la impresora',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'El título del ticket es requerido' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Descripción detallada del problema',
    example: 'La impresora HP del departamento de ventas no imprime documentos desde ayer.',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción del ticket es requerida' })
  description: string;

  @ApiPropertyOptional({
    description: 'Prioridad del ticket',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    default: TicketPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TicketPriority, {
    message: 'La prioridad debe ser low, medium, high o critical',
  })
  priority?: TicketPriority;

  @ApiProperty({
    description: 'ID de la categoría del ticket',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El categoryId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La categoría del ticket es requerida' })
  categoryId: string;

  @ApiProperty({
    description: 'ID del cliente que reporta el ticket',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El clientId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El cliente es requerido' })
  clientId: string;

  @ApiPropertyOptional({
    description: 'ID del técnico asignado (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El technicianId debe ser un UUID válido' })
  technicianId?: string;
}
