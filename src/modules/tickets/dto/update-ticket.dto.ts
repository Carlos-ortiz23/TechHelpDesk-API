import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateTicketDto extends PartialType(
  OmitType(CreateTicketDto, ['clientId'] as const),
) {
  @ApiPropertyOptional({
    description: 'ID del técnico asignado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El technicianId debe ser un UUID válido' })
  technicianId?: string;
}
