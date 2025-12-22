import { BadRequestException,Inject,  Injectable,Logger,} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { Model, Types } from 'mongoose';
import {
  DevicePlatform,
  DeviceToken,
  DeviceTokenDocument,
} from './entities/device-token.entity';

export interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly messaging: Messaging;

  constructor(
    @Inject('FIREBASE_ADMIN') firebaseApp: App,
    @InjectModel(DeviceToken.name)
    private readonly deviceTokenModel: Model<DeviceTokenDocument>,
  ) {
    this.messaging = getMessaging(firebaseApp);
  }

  async registerDevice(
    userId: string,
    token: string,
    platform: DevicePlatform = 'web',
  ): Promise<void> {
    const trimmedToken = (token ?? '').trim();
    if (!trimmedToken) {
      throw new BadRequestException('Device token is required');
    }

    const normalizedPlatform = platform || 'web';
    const supportedPlatforms: DevicePlatform[] = ['web', 'ios', 'android'];
    if (!supportedPlatforms.includes(normalizedPlatform)) {
      throw new BadRequestException('Invalid platform');
    }

    const now = new Date();
    const normalizedUserId = this.ensureObjectId(userId);

    await this.deviceTokenModel
      .findOneAndUpdate(
        { token: trimmedToken },
        {
          $set: {
            userId: normalizedUserId,
            platform: normalizedPlatform,
            lastSeenAt: now,
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async sendToToken(token: string, payload: FcmPayload): Promise<string | null> {
    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: this.sanitizeData(payload.data),
    };

    try {
      return await this.messaging.send(message);
    } catch (error) {
      if (this.isInvalidTokenError(error)) {
        await this.removeToken(token);
        return null;
      }
      this.logger.error(
        `Failed to send FCM to token ${token}`,
        error?.stack || '',
      );
      throw error;
    }
  }

  async sendToUser( userId: string,payload: FcmPayload,): Promise<{ success: number; failure: number }> {
    const normalizedUserId = this.ensureObjectId(userId);
    const devices = await this.deviceTokenModel
      .find({ userId: normalizedUserId, isActive: true })
      .select('token')
      .lean()
      .exec();

    const tokens = devices.map((device) => device.token);
    if (!tokens.length) {
      return { success: 0, failure: 0 };
    }

    const response = await this.messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: this.sanitizeData(payload.data),
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, index) => {
      if (res.error) {
        if (this.isInvalidTokenError(res.error)) {
          invalidTokens.push(tokens[index]);
        } else {
          this.logger.error(
            `FCM failure for token ${tokens[index]}`,
            res.error?.stack || res.error?.message,
          );
        }
      }
    });

    if (invalidTokens.length) {
      await this.deviceTokenModel
        .deleteMany({ token: { $in: invalidTokens } })
        .exec();
    }

    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  }

  async sendToTopic(topic: string, payload: FcmPayload): Promise<string> {
    return this.messaging.send({
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: this.sanitizeData(payload.data),
    });
  }

  private sanitizeData(
    data?: Record<string, any>,
  ): Record<string, string> | undefined {
    if (!data) {
      return undefined;
    }
    return Object.entries(data).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {},
    );
  }

  private isInvalidTokenError(error: any): boolean {
    const code = error?.code || error?.errorInfo?.code;
    return (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    );
  }

  private async removeToken(token: string): Promise<void> {
    await this.deviceTokenModel.deleteOne({ token }).exec();
  }

  private ensureObjectId(id: string): Types.ObjectId {
    if (Types.ObjectId.isValid(id)) {
      return new Types.ObjectId(id);
    }
    throw new BadRequestException('Invalid user id');
  }
}
