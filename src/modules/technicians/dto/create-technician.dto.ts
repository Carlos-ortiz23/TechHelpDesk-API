import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTechnicianDto {
  @ApiProperty({
    description: 'Nombre del técnico',
    example: 'Carlos Rodríguez',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del técnico es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Especialidad del técnico',
    example: 'Redes y Comunicaciones',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La especialidad no puede exceder 100 caracteres' })
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Disponibilidad del técnico',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'availability debe ser un valor booleano' })
  availability?: boolean;

  @ApiPropertyOptional({
    description: 'ID del usuario asociado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  userId?: string;
}
