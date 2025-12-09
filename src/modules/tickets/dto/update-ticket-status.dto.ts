import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TicketStatus } from '../../../common/enums/ticket-status.enum';

export class UpdateTicketStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del ticket',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
  })
  @IsEnum(TicketStatus, {
    message: 'El estado debe ser open, in_progress, resolved o closed',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status: TicketStatus;
}
