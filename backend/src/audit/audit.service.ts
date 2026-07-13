import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre une action sensible dans le journal d'audit.
   * Ne doit JAMAIS faire échouer l'opération métier en cours si l'écriture
   * du log échoue (on logue l'erreur côté serveur et on continue) —
   * l'audit ne doit pas devenir un point de défaillance pour l'appli.
   */
  async enregistrer(params: {
    userId: string;
    action: string;
    ressourceType: string;
    ressourceId: string;
    details?: Record<string, unknown>;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          ressourceType: params.ressourceType,
          ressourceId: params.ressourceId,
          detailsJson: params.details as any,
        },
      });
    } catch (error) {
      this.logger.error(
        `Échec d'écriture dans le journal d'audit (${params.action} sur ${params.ressourceType}/${params.ressourceId})`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  findAll(params: { ressourceType?: string; userId?: string }) {
    const { ressourceType, userId } = params;
    return this.prisma.auditLog.findMany({
      where: {
        ...(ressourceType ? { ressourceType } : {}),
        ...(userId ? { userId } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
