import { CreateDeviceStubHepler } from './helper/create.device.stub.helper';
import { DeviceStubInfo } from './interfaces/device.stub.info';

export class DeviceRepositoryMock {
  devicesInfo: DeviceStubInfo[];

  constructor(devicesDetail: DeviceStubInfo[]) {
    this.devicesInfo = devicesDetail;
  }
  build() {
    return {
      create: jest.fn().mockReturnValue(null),
      save: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockImplementation(() => ({
        leftJoinAndSelect: jest.fn().mockImplementation(() => ({
          leftJoinAndSelect: jest.fn().mockImplementation(() => ({
            where: jest.fn().mockImplementation((impression1, where1) => ({
              getMany: jest
                .fn()
                .mockImplementation(() =>
                  this.getDevicesByUserId(where1.user_id),
                ),
              andWhere: jest.fn().mockImplementation((impression2, where2) => ({
                getOne: jest
                  .fn()
                  .mockImplementation(() =>
                    this.getDeviceFromOwner(where2.user_id, where1.id),
                  ),
              })),
            })),
          })),
        })),
      })),
    };
  }

  getDevicesByUserId(userId: number) {
    const result = this.devicesInfo.filter(
      (device) => device.user.id === userId,
    );

    return result.length === 0
      ? Promise.resolve([])
      : Promise.resolve(CreateDeviceStubHepler.createDevicesStub(result));
  }

  getDeviceFromOwner(deviceId: number, userId: number) {
    const result = this.devicesInfo.filter(
      (device) => device.user.id === userId && device.id === deviceId,
    );

    return result.length === 0
      ? Promise.resolve(undefined)
      : Promise.resolve(CreateDeviceStubHepler.createDeviceStub(result[0]));
  }
}
