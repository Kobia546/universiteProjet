import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ModuleCode } from '@prisma/client';

export class CreateProfilDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(ModuleCode, { each: true })
  modules: ModuleCode[];
}
