import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @MessagePattern({ cmd: 'devices.register' })
  register(
    @Payload()
    {
      userId,
      deviceName,
      deviceTopics,
    }: {
      userId: number;
      deviceName: string;
      deviceTopics: string[];
    },
  ) {
    return this.devicesService.register(userId, deviceName, deviceTopics);
  }

  @MessagePattern({ cmd: 'devices.unregister' })
  unregister(
    @Payload() { userId, deviceId }: { userId: number; deviceId: number },
  ) {
    return this.devicesService.unregister(userId, deviceId);
  }

  @MessagePattern({ cmd: 'devices.list' })
  list(@Payload() { userId }: { userId: number }) {
    return this.devicesService.getDevicesList(userId);
  }

  @MessagePattern({ cmd: 'devices.details' })
  getDeviceDetails(
    @Payload() { userId, deviceId }: { userId: number; deviceId: number },
  ) {
    return this.devicesService.getDeviceDetails(userId, deviceId);
  }

  @MessagePattern({ cmd: 'devices.topics.add' })
  addTopics(
    @Payload()
    {
      userId,
      deviceId,
      deviceTopics,
    }: {
      userId: number;
      deviceId: number;
      deviceTopics: string[] | string;
    },
  ) {
    return this.devicesService.addDeviceTopics(userId, deviceId, deviceTopics);
  }

  @MessagePattern({ cmd: 'devices.topics.remove' })
  removeTopics(
    @Payload()
    {
      userId,
      deviceId,
      deviceTopics,
    }: {
      userId: number;
      deviceId: number;
      deviceTopics: string[] | string;
    },
  ) {
    return this.devicesService.removeDeviceTopics(
      userId,
      deviceId,
      deviceTopics,
    );
  }

  @MessagePattern({ cmd: 'user.device.topic.check' })
  checkTopic(
    @Payload()
    {
      userId,
      deviceId,
      deviceTopic,
    }: {
      userId: number;
      deviceId: number;
      deviceTopic: string;
    },
  ) {
    return this.devicesService.checkDeviceTopic(userId, deviceId, deviceTopic);
  }
}
