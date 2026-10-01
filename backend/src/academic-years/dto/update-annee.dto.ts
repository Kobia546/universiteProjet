import { PartialType } from '@nestjs/mapped-types';
import { CreateAnneeDto } from './create-annee.dto';

export class UpdateAnneeDto extends PartialType(CreateAnneeDto) {}
