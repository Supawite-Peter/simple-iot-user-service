import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { Topic } from './entities/topic.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  DeviceDetail,
  TopicAdd,
  TopicRemove,
} from './interfaces/device.interface';

@Injectable()
export class DevicesService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(Device) private devicesRepository: Repository<Device>,
    @InjectRepository(Topic) private topicsRepository: Repository<Topic>,
  ) {}

  async register(
    requesterId: number,
    deviceName: string,
    deviceTopics: string[],
  ): Promise<DeviceDetail> {
    // Check if user exists
    const user = await this.getUser(requesterId);

    // Check device name
    if (deviceName === undefined)
      throw new RpcException(new BadRequestException('Device name is missing'));

    // Create topics
    const topics = await this.createTopics(deviceTopics);

    // Register device
    const device = this.devicesRepository.create({
      name: deviceName,
      user: user,
      topics: topics,
    });
    await this.devicesRepository.save(device);

    return this.getDeviceDetails(device);
  }

  async unregister(
    requesterId: number,
    deviceId: number,
  ): Promise<DeviceDetail> {
    // Check if device exists
    const device = await this.getAndCheckDeviceOwner(deviceId, requesterId);

    // Unregister device
    await this.devicesRepository.remove(device);

    return this.getDeviceDetails(device, deviceId);
  }

  async getDevicesList(requesterId: number): Promise<DeviceDetail[]> {
    // Get & Check if user exists
    const user = await this.getUser(requesterId);
    // Get devices
    const devices = await this.findDeviceOwner(user.id);
    // Check if devices exist
    if (devices.length === 0)
      throw new RpcException(new NotFoundException('No devices found'));

    return this.getDevicesDetails(devices);
  }

  async addDeviceTopics(
    requesterId: number,
    deviceId: number,
    deviceTopics: string[] | string,
  ): Promise<TopicAdd> {
    // Get device
    const device = await this.getAndCheckDeviceOwner(deviceId, requesterId);

    // if topics is a string, convert it to an array
    if (typeof deviceTopics === 'string') {
      deviceTopics = [deviceTopics];
    }

    // Get topics to register
    const registeredTopics = this.getTopicsDetails(device);
    const toRegisterTopics: Set<string> = new Set();
    for (const topic of deviceTopics) {
      if (!registeredTopics.includes(topic)) {
        toRegisterTopics.add(topic);
      }
    }
    const addedTopics = Array.from(toRegisterTopics);

    // Check if there are topics to register
    if (addedTopics.length === 0)
      throw new RpcException(
        new BadRequestException('Topics are already registered'),
      );
    await this.createTopics(addedTopics, device);

    return {
      topicsAdded: addedTopics.length,
      topics: addedTopics,
    };
  }

  async removeDeviceTopics(
    requesterId: number,
    deviceId: number,
    deviceTopics: string[] | string,
  ): Promise<TopicRemove> {
    // Get device
    const device = await this.getAndCheckDeviceOwner(deviceId, requesterId);

    // if topics is a string, convert it to an array
    if (typeof deviceTopics === 'string') {
      deviceTopics = [deviceTopics];
    }

    // Get topics that will be removed
    const toRemovedTopics = [];
    for (const topic of device.topics) {
      if (deviceTopics.includes(topic.name)) toRemovedTopics.push(topic);
    }

    // Check if there are topics to remove
    if (toRemovedTopics.length === 0)
      throw new RpcException(
        new BadRequestException('Topics are not registered'),
      );

    // Remove topics
    await this.topicsRepository.remove(toRemovedTopics);

    return {
      topicsRemoved: toRemovedTopics.length,
      topics: toRemovedTopics.map((topic) => topic.name),
    };
  }

  async checkDeviceTopic(
    requesterId: number,
    deviceId: number,
    deviceTopic: string,
  ): Promise<boolean> {
    // Get device
    const device = await this.getAndCheckDeviceOwner(deviceId, requesterId);

    // Check if topic is registered
    if (!device.topics.map((t) => t.name).includes(deviceTopic))
      throw new RpcException(
        new BadRequestException('Topic is not registered'),
      );

    return true;
  }

  private async findDeviceOwner(ownerId: number): Promise<Device[]> {
    return this.devicesRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.user', 'user')
      .leftJoinAndSelect('device.topics', 'topic')
      .where('user.id = :user_id', { user_id: ownerId })
      .getMany();
  }

  private async getUser(requesterId: number): Promise<User> {
    // Get & Check if user exists
    const user = await this.usersService.findUserId(requesterId);
    if (!user) throw new RpcException(new NotFoundException('User not found'));

    return user;
  }

  private async getAndCheckDeviceOwner(
    deviceId: number,
    ownerId: number,
  ): Promise<Device> {
    // Get & Check if device exists
    const device = await this.devicesRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.user', 'user')
      .leftJoinAndSelect('device.topics', 'topic')
      .where('device.id = :id', { id: deviceId })
      .andWhere('user.id = :user_id', { user_id: ownerId })
      .getOne();
    if (!device)
      throw new RpcException(
        new NotFoundException(
          `Device with id ${deviceId} was not found for user with id ${ownerId}`,
        ),
      );

    return device;
  }

  private async createTopics(
    topicsName: string[],
    device?: Device,
  ): Promise<Topic[]> {
    // Initialize topics array
    const createdTopics = [] as Topic[];

    // Check if topicsName is empty
    if (topicsName === undefined || topicsName.length === 0)
      return createdTopics;

    // Create topics
    for (const topic of topicsName)
      createdTopics.push(
        device != null
          ? this.topicsRepository.create({ name: topic, device: device })
          : this.topicsRepository.create({ name: topic }),
      );

    // Save topics if device is registered to the topics
    if (device != null) await this.topicsRepository.save(createdTopics);

    return createdTopics;
  }

  private getDeviceDetails(device: Device, id?: number): DeviceDetail {
    return {
      id: device.id ? device.id : id,
      name: device.name,
      userId: device.user.id,
      serial: device.serial,
      topics: this.getTopicsDetails(device),
    };
  }

  private getDevicesDetails(devices: Device[]): DeviceDetail[] {
    return devices.map((device) => this.getDeviceDetails(device));
  }

  private getTopicsDetails(device: Device): string[] {
    return device.topics ? device.topics.map((topic) => topic.name) : [];
  }
}
