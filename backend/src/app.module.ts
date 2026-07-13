import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { StudentsModule } from './students/students.module';
import { ProgramsModule } from './programs/programs.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { PaymentRulesModule } from './payment-rules/payment-rules.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AccountingModule } from './accounting/accounting.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        // Limite générale : 100 requêtes / minute / IP sur toute l'API.
        // Les routes sensibles (login) ont une limite plus stricte via @Throttle().
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    StudentsModule,
    ProgramsModule,
    AcademicYearsModule,
    PaymentRulesModule,
    EnrollmentsModule,
    AccountingModule,
    PaymentsModule,
    DashboardModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting appliqué avant l'authentification
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Toutes les routes sont protégées par défaut, sauf @Public()
    },
  ],
})
export class AppModule {}
