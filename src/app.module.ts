import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp-grpc/whatsapp.module';
import { EmailModule } from './emails/email.module';
import { ApplicationModule } from './application/application.module';

@Module({
  imports: [WhatsappModule,EmailModule, ApplicationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
