import { CreateUserStubHepler } from '../../../users/mocks/helper/create.user.stub.helper';
import { DeviceStubInfo } from '../interfaces/device.stub.info';
import { Topic } from '../../entities/topic.entity';
import { Device } from '../../entities/device.entity';

export class CreateDeviceStubHepler extends CreateUserStubHepler {
  static createTopicStub(id: number, name: string): Topic {
    const topic = new Topic();
    topic.id = id;
    topic.name = name;
    return topic;
  }

  static createDeviceStub(info: DeviceStubInfo): Device {
    const device = new Device();
    device.id = info.id;
    device.name = info.name;
    device.user = this.createUserStub(info.user);
    device.topics = this.createTopicsStub(info.topics.id, info.topics.name);
    return device;
  }

  static createDevicesStub(devices: DeviceStubInfo[]): Device[] {
    const devicesList: Device[] = [];
    for (let i = 0; i < devices.length; i++) {
      devicesList.push(this.createDeviceStub(devices[i]));
    }
    return devicesList;
  }

  static createTopicsStub(id: number[], name: string[]): Topic[] {
    if (id.length !== name.length) throw new Error('Invalid input');
    const topics: Topic[] = [];
    for (let i = 0; i < id.length; i++) {
      topics.push(this.createTopicStub(id[i], name[i]));
    }
    return topics;
  }
}
