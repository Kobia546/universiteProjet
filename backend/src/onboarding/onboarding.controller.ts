import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  create(@Body() dto: CreateOnboardingDto, @CurrentUser() user: { userId: string }) {
    return this.onboardingService.create(dto, user.userId);
  }
}
