import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'María García',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Nombre de la empresa',
    example: 'Tech Solutions S.A.',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'La empresa no puede exceder 150 caracteres' })
  company?: string;

  @ApiProperty({
    description: 'Correo electrónico de contacto',
    example: 'maria.garcia@techsolutions.com',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo de contacto es requerido' })
  @MaxLength(150, { message: 'El correo no puede exceder 150 caracteres' })
  contactEmail: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario asociado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  userId?: string;
}
