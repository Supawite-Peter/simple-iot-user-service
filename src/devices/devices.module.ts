import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { UsersModule } from '../users/users.module';
import { Device } from './entities/device.entity';
import { Topic } from './entities/topic.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Device, Topic])],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
