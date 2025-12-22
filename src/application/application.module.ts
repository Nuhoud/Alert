import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { EmailModule } from '../emails/email.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports:[
    WhatsappModule,
    EmailModule,
    FirebaseModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
