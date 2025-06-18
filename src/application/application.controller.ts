import { Controller } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  // Submit new application
  // send the application for employer email with some user data
  // tell User that his application has been created
  @EventPattern('job.application.created')
  async sumbitApplication(@Payload() message: any) {
    await this.applicationService.sumbitApplicationNotifications(message);
  }

  // application status changed
  // notify the user with:  1-new status  2-the employer note
  @EventPattern('job.application.statusChange')
  async handleStatusChange(@Payload() message: any) {
    await this.applicationService.sendApplicationStatusToUser(message);
  }

}
