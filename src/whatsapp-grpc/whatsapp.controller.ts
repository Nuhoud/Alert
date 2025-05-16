import { Controller, Get, Render, Res } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { WhatsappService } from './whatsapp.service';
import { Response } from 'express';

interface SendMessageRequest {
  mobileNumber: string;
  text: string;
}

interface SendMessageResponse {
  ok: boolean;
  message: string;
}

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('login')
  async login(@Res() res: Response) {
    const qrStatus = this.whatsappService.getQrStatus();

    if (qrStatus === null) {
      return res.send('please try later');
    }
    
    if (qrStatus === false) {
      return res.send('Login successful');
    }
    
    const qrImage = await this.whatsappService.generateQrImage(qrStatus.toString());
    return res.render('qr', { img: qrImage });
  }

  @GrpcMethod('WhatsApp', 'SendMessage')
  async sendMessage(request: SendMessageRequest,metadata: any,): Promise<SendMessageResponse> {
    return this.whatsappService.sendMessage(request, metadata);
  }
}
