import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  // Create the HTTP application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  // Configure view engine
  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  
  // Create a hybrid application that also serves gRPC
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'alerts',
      protoPath: join(__dirname, 'proto/alerts.proto'),
      url: process.env.GRPC_URL || '0.0.0.0:50051',
    },
  });
  
  try {
    const kafkaMicroservice = app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'alert',
          brokers: [process.env.KAFKA_URL || 'localhost:9092'],
        },
        consumer: {
          groupId: 'alert-consumer',
        },
      },
    });
    await app.startAllMicroservices();
  } catch (e) {
    console.log('Kafka connection failed, continuing without it');
  }
  
  // Start HTTP server
  await app.listen(process.env.PORT || 8080);
  
  console.log(`Application is running on: ${await app.getUrl()}` );
  console.log(`gRPC server is running on: ${process.env.GRPC_URL || '0.0.0.0:50051'}`);
}
bootstrap();
