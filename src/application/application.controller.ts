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
    console.log("kafka created message",message);
    await this.applicationService.sumbitApplicationNotifications(message);
  }

  // application status changed
  // notify the user with:  1-new status  2-the employer note
  @EventPattern('job.application.statusChange')
  async handleStatusChange(@Payload() message: any) {
    console.log("kafka status change message",message);
    await this.applicationService.sendApplicationStatusToUser(message);
  }

  // application not created
  // notify the user with the reason
  @EventPattern('job.application.notcreated')
  async handleNotCreated(@Payload() message: any) {
    console.log("kafka not created message",message);
    await this.applicationService.sendApplicationNotCreatedNotification(message);
  }

}
