import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {EmailRequest,EmailResponse } from './interfaces/email.interface'
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a nodemailer transporter using Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async SendMail(data: EmailRequest): Promise<EmailResponse> {
    try {
      await this.transporter.sendMail({
        from: `"Nuhoud" <${process.env.EMAIL_USER}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });

      return { ok: true, message: 'Email sent successfully' };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }
  
}
