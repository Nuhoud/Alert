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
  
  // Configure view engine
  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  
  // Create a hybrid application that also serves gRPC
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'whatsapp',
      protoPath: join(__dirname, '..', 'src', 'whatsapp-grpc', 'proto', 'whatsapp.proto'),
      url: process.env.GRPC_URL || '0.0.0.0:50051',
    },
  });

  // Start all microservices (gRPC)
  await app.startAllMicroservices();
  
  // Start HTTP server
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`gRPC server is running on: ${process.env.GRPC_URL || '0.0.0.0:50051'}`);
}
bootstrap();
