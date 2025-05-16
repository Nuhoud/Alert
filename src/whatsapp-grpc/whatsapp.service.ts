import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class WhatsappService implements OnModuleInit {
  private session: Client;
  private tokenQr: string | boolean | null = null;

  constructor() {
    this.session = new Client({
      authStrategy: new LocalAuth({
        dataPath: 'session',
        clientId: 'primary',
      }),
    });

    this.session.on('qr', (qr) => {
      this.tokenQr = qr;
      console.log('qr', qr);
    });

    this.session.on('ready', () => {
      this.tokenQr = false;
      console.log('Login successful');
    });
  }

  async onModuleInit() {
    await this.session.initialize();
  }

  getQrStatus() {
    return this.tokenQr;
  }

  async generateQrImage(qrData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      qrcode.toDataURL(qrData, (err, src) => {
        if (err) {
          reject(err);
        } else {
          resolve(src);
        }
      });
    });
  }

  async sendMessage(request: { mobileNumber: string; text: string }, metadata: any) {
    const password = metadata.get('x-password')?.[0];
    
    if (password !== process.env.WHATSAPP_API_PASSWORD) {
      return {
        ok: false,
        message: 'Invalid password',
      };
    }

    const { mobileNumber, text } = request;
    const chatId = mobileNumber.endsWith('@c.us') ? mobileNumber : `${mobileNumber}@c.us`;

    try {
      await this.session.sendMessage(chatId, text);
      return { ok: true, message: 'Message sent' };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }
}
