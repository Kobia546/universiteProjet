import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { StudentsModule } from '../students/students.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { PaymentsModule } from '../payments/payments.module';
import { CarnetRecuModule } from '../carnet-recu/carnet-recu.module';

@Module({
  imports: [StudentsModule, EnrollmentsModule, PaymentsModule, CarnetRecuModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
