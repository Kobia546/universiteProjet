import { PartialType } from '@nestjs/mapped-types';
import { CreateReglePaiementDto } from './create-regle-paiement.dto';

export class UpdateReglePaiementDto extends PartialType(CreateReglePaiementDto) {}
