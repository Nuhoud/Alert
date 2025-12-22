import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DevicePlatform = 'web' | 'ios' | 'android';
export type DeviceTokenDocument = DeviceToken & Document;

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true, trim: true })
  token: string;

  @Prop({ required: true, type: String, enum: ['web', 'ios', 'android'], index: true })
  platform: DevicePlatform;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastSeenAt?: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

DeviceTokenSchema.index({ token: 1 }, { unique: true });
