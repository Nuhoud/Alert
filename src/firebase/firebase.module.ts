import { Module } from '@nestjs/common';
import { cert, getApps, initializeApp, ServiceAccount, App } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_FIREBASE_CREDENTIAL_FILE } from './firebase.constants';
import { FirebaseController } from './firebase.controller';
import { FcmService } from './firebase.service';
import { DeviceToken, DeviceTokenSchema } from './entities/device-token.entity';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './entities/notification.entity';

async function loadServiceAccount(): Promise<ServiceAccount> {
  const envLocation = process.env.ServiceAccountPath;

  const candidates: string[] = [];
  if (envLocation) {
    candidates.push(envLocation);
  }
  // try project root file name
  candidates.push(path.join(process.cwd(), DEFAULT_FIREBASE_CREDENTIAL_FILE));
  // try src/firebase location (useful during development)
  candidates.push(path.join(process.cwd(), 'src', 'firebase', DEFAULT_FIREBASE_CREDENTIAL_FILE));

  const readCredentials = async (filePath: string) => {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    const fileContent = await fs.promises.readFile(absolutePath, 'utf8');
    return JSON.parse(fileContent) as ServiceAccount;
  };

  const errors: any[] = [];
  for (const candidate of candidates) {
    try {
      return await readCredentials(candidate);
    } catch (err) {
      errors.push({ path: candidate, error: err });
    }
  }

  const tried = candidates.join(', ');
  const message = `Could not load Firebase service account. Tried: ${tried}`;
  const combinedError: any = new Error(message);
  combinedError.details = errors;
  throw combinedError;
}

const firebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: async (): Promise<App> => {
    const credentials = await loadServiceAccount();
    const existing = getApps()[0];
    if (existing) {
      return existing;
    }
    return initializeApp({
      credential: cert(credentials),
    });
  },
};

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [FirebaseController],
  providers: [firebaseAdminProvider, FcmService],
  exports: [FcmService, firebaseAdminProvider],
})
export class FirebaseModule {}
