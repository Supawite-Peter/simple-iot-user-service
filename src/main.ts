import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const microserviceRmq = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RMQ_URL],
      queue: process.env.RMQ_USER_QUEUE,
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.API_PORT || 3000);
}
bootstrap();
