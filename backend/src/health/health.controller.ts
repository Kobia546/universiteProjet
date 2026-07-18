import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Endpoint public de santé, à utiliser avec un service de monitoring
   * externe (UptimeRobot, etc.). Vérifie aussi que la base de données
   * répond, pas seulement que le process Node est en vie.
   */
  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', database: 'unreachable', timestamp: new Date().toISOString() };
    }
  }
}
