import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { EmailModule } from './emails/email.module';
import { ApplicationModule } from './application/application.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [WhatsappModule,EmailModule, ApplicationModule, FirebaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
