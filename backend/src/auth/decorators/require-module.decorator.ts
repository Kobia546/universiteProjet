import { SetMetadata } from '@nestjs/common';
import { ModuleCode } from '@prisma/client';

export const REQUIRE_MODULE_KEY = 'requireModule';
export const RequireModule = (module: ModuleCode) => SetMetadata(REQUIRE_MODULE_KEY, module);
