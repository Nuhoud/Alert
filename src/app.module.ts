import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp-grpc/whatsapp.module';
import { EmailModule } from './emails/email.module';

@Module({
  imports: [WhatsappModule,EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
