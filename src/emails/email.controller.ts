import { Controller, Get, Render, Res } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EmailService } from './email.service';
import {EmailRequest,EmailResponse } from './interfaces/email.interface'
import { Response } from 'express';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @GrpcMethod('EmailService', 'SendEmail')
  async sendEmail(request: EmailRequest,): Promise<EmailResponse> {
    return this.emailService.SendMail(request);
  }
  
}
