import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleCode } from '@prisma/client';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModule = this.reflector.getAllAndOverride<ModuleCode | undefined>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredModule) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.modules?.includes(requiredModule)) {
      throw new ForbiddenException("Votre profil n'a pas accès à ce module.");
    }
    return true;
  }
}
