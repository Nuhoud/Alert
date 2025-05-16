import { Controller, Get, Render, Res } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { WhatsappService } from './whatsapp.service';
import {MessageResponse,MessageRequest} from './interfaces/whatsapp.interface'
import { Response } from 'express';


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

  @GrpcMethod('WhatsAppService', 'SendMessage')
  async sendMessage(request: MessageRequest,metadata: any,): Promise<MessageResponse> {
    console.log('here')
    return this.whatsappService.sendMessage(request, metadata);
  }
}
