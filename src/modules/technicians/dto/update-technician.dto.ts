import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTechnicianDto } from './create-technician.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTechnicianDto extends PartialType(CreateTechnicianDto) {
  @ApiPropertyOptional({
    description: 'Estado activo del técnico',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;
}
