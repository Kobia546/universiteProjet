import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(email: string, motDePasse: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const motDePasseValide = await argon2.verify(user.motDePasseHash, motDePasse);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    return user;
  }

  async login(email: string, motDePasse: string) {
    const user = await this.validateUser(email, motDePasse);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
    };

    await this.auditService.enregistrer({
      userId: user.id,
      action: 'login',
      ressourceType: 'user',
      ressourceId: user.id,
    });

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role.code,
      },
    };
  }
}
