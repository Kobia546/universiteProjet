import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query('ressourceType') ressourceType?: string, @Query('userId') userId?: string) {
    return this.auditService.findAll({ ressourceType, userId });
  }
}
