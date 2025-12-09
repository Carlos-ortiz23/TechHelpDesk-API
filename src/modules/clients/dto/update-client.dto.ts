import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional({
    description: 'Estado activo del cliente',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;
}
