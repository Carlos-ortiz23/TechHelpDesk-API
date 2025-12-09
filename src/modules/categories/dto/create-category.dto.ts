import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Incidente de Hardware',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de la categoría',
    example: 'Problemas relacionados con hardware físico',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
