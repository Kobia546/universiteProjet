import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SELECTION_PUBLIQUE = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  actif: true,
  createdAt: true,
  profil: { select: { id: true, nom: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: SELECTION_PUBLIQUE,
    });
  }

  async create(dto: CreateUserDto) {
    const motDePasseHash = await argon2.hash(dto.motDePasse);
    try {
      return await this.prisma.user.create({
        data: {
          nom: dto.nom,
          prenom: dto.prenom,
          email: dto.email,
          motDePasseHash,
          profilId: dto.profilId,
        },
        select: SELECTION_PUBLIQUE,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Un utilisateur avec l'email "${dto.email}" existe déjà`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    const { motDePasse, ...reste } = dto;
    const data: Prisma.UserUncheckedUpdateInput = { ...reste };
    if (motDePasse) {
      data.motDePasseHash = await argon2.hash(motDePasse);
    }

    try {
      return await this.prisma.user.update({ where: { id }, data, select: SELECTION_PUBLIQUE });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Un utilisateur avec l'email "${dto.email}" existe déjà`);
      }
      throw e;
    }
  }

  async setActif(id: string, actif: boolean, currentUserId: string) {
    if (id === currentUserId && !actif) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    return this.prisma.user.update({ where: { id }, data: { actif }, select: SELECTION_PUBLIQUE });
  }
}
