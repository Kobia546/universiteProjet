import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AjouterExclusionsDto {
  /** Numéros arrachés / supprimés du carnet papier (1 à 500 à la fois). */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Min(1, { each: true })
  numeros: number[];

  @IsOptional()
  @IsString()
  motif?: string;
}
