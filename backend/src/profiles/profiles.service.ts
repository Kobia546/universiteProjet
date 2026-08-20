import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfilDto } from './dto/create-profil.dto';
import { UpdateProfilDto } from './dto/update-profil.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.profil.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async create(dto: CreateProfilDto) {
    try {
      return await this.prisma.profil.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Un profil nommé "${dto.nom}" existe déjà`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateProfilDto) {
    const profil = await this.prisma.profil.findUnique({ where: { id } });
    if (!profil) throw new NotFoundException(`Profil ${id} introuvable`);

    try {
      return await this.prisma.profil.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Un profil nommé "${dto.nom}" existe déjà`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    const profil = await this.prisma.profil.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!profil) throw new NotFoundException(`Profil ${id} introuvable`);
    if (profil.systeme) {
      throw new BadRequestException('Ce profil est protégé et ne peut pas être supprimé.');
    }
    if (profil._count.users > 0) {
      throw new BadRequestException(
        "Ce profil est encore assigné à des utilisateurs — réassignez-les avant de le supprimer.",
      );
    }
    return this.prisma.profil.delete({ where: { id } });
  }
}
