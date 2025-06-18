import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { WhatsappModule } from '../whatsapp-grpc/whatsapp.module';
import { EmailModule } from '../emails/email.module';

@Module({
  imports:[
    WhatsappModule,
    EmailModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
