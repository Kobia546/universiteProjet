import { PartialType } from '@nestjs/mapped-types';
import { CreateFiliereDto } from './create-filiere.dto';

export class UpdateFiliereDto extends PartialType(CreateFiliereDto) {}
