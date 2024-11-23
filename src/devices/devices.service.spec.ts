import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { DevicesService } from './devices.service';
import { UsersService } from '../users/users.service';
import { Device } from './entities/device.entity';
import { Topic } from './entities/topic.entity';
import { DeviceRepositoryMock } from './mocks/device.repository.mock';
import { TopicRepositoryMock } from './mocks/topic.repository.mock';
import { UsersServiceMock } from './mocks/users.service.mock';
import { DeviceStubInfo } from './mocks/interfaces/device.stub.info';
import { UserStubInfo } from '../users/mocks/interfaces/user.stub.info';
import { CreateDeviceStubHepler } from './mocks/helper/create.device.stub.helper';

describe('DevicesService', () => {
  let deviceRepositoryMock: DeviceRepositoryMock;
  let usersServiceMock: UsersServiceMock;
  let service: DevicesService;
  let deviceRepository: Repository<Device>;
  let topicRepository: Repository<Topic>;

  // For testing purposes
  // userId: 1,2,3 => exist in database
  // deviceId: 1,2, => exist in database
  // topicId: 1,2,3,4 => exist in database
  // else => not exist in database
  const device1StubInfo: DeviceStubInfo = {
    user: {
      id: 1,
      username: 'exist1',
      passwordHash: 'hashpassword1',
      firstName: 'first1',
      lastName: 'last1',
    },
    id: 1,
    name: 'device1',
    topics: {
      id: [1, 2],
      name: ['topic1', 'topic2'],
    },
  };
  const device2StubInfo: DeviceStubInfo = {
    user: {
      id: 2,
      username: 'exist2',
      passwordHash: 'hashpassword2',
      firstName: 'first2',
      lastName: 'last2',
    },
    id: 2,
    name: 'device2',
    topics: {
      id: [3, 4],
      name: ['topic3', 'topic4'],
    },
  };
  const user3StubInfo: UserStubInfo = {
    id: 3,
    username: 'exist3',
    passwordHash: 'hashpassword3',
    firstName: 'first3',
    lastName: 'last3',
  };

  beforeEach(async () => {
    deviceRepositoryMock = new DeviceRepositoryMock([
      device1StubInfo,
      device2StubInfo,
    ]);
    usersServiceMock = new UsersServiceMock([
      device1StubInfo.user,
      device2StubInfo.user,
      user3StubInfo,
    ]);

    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getRepositoryToken(Device),
          useValue: deviceRepositoryMock.build(),
        },
        {
          provide: getRepositoryToken(Topic),
          useValue: TopicRepositoryMock.build(),
        },
      ],
    })
      .useMocker((token) => {
        switch (token) {
          case UsersService:
            return usersServiceMock.build();
        }
      })
      .compile();

    service = module.get<DevicesService>(DevicesService);
    deviceRepository = module.get(getRepositoryToken(Device));
    topicRepository = module.get(getRepositoryToken(Topic));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(deviceRepository).toBeDefined();
    expect(topicRepository).toBeDefined();
  });

  describe('register', () => {
    it('should register a new device to a requester', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceName: 'New Device',
        deviceTopics: ['NewTopic1', 'NewTopic2'],
      };
      const userStub = CreateDeviceStubHepler.createUserStub(
        device1StubInfo.user,
      );
      const topicsStub = CreateDeviceStubHepler.createTopicsStub(
        [7, 8],
        input.deviceTopics,
      );
      jest.spyOn(deviceRepository, 'create').mockReturnValueOnce({
        id: 99,
        name: input.deviceName,
        user: userStub,
        topics: topicsStub,
      } as Device);

      // Act & Assert
      expect(
        await service.register(
          input.requesterId,
          input.deviceName,
          input.deviceTopics,
        ),
      ).toEqual({
        id: 99,
        name: input.deviceName,
        serial: undefined,
        userId: input.requesterId,
        topics: input.deviceTopics,
      });
    });

    it('should able to register when no topics are provided', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceName: 'New Device 2',
        deviceTopics: [],
      };
      const userStub = CreateDeviceStubHepler.createUserStub(
        device1StubInfo.user,
      );
      jest.spyOn(deviceRepository, 'create').mockReturnValueOnce({
        id: 100,
        name: input.deviceName,
        user: userStub,
        topics: [],
      } as Device);

      // Act & Assert
      expect(
        await service.register(
          input.requesterId,
          input.deviceName,
          input.deviceTopics,
        ),
      ).toEqual({
        id: 100,
        name: input.deviceName,
        serial: undefined,
        userId: input.requesterId,
        topics: input.deviceTopics,
      });
    });

    it('should throw not found if requester does not exist', async () => {
      // Arrange
      const input = {
        requesterId: 4,
        deviceName: 'New Device 3',
        deviceTopics: ['NewTopic3', 'NewTopic4'],
      };

      // Act & Assert
      await expect(
        service.register(
          input.requesterId,
          input.deviceName,
          input.deviceTopics,
        ),
      ).rejects.toThrow(
        new RpcException(new NotFoundException('User not found')),
      );
    });

    it('should throw bad request if device name is missing', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceName: undefined,
        deviceTopics: ['NewTopic5', 'NewTopic6'],
      };

      // Act & Assert
      await expect(
        service.register(
          input.requesterId,
          input.deviceName,
          input.deviceTopics,
        ),
      ).rejects.toThrow(
        new RpcException(new BadRequestException('Device name is missing')),
      );
    });
  });

  describe('unregister', () => {
    it('should unregister a device', async () => {
      // Act & Assert
      expect(
        await service.unregister(device1StubInfo.user.id, device1StubInfo.id),
      ).toEqual({
        id: device1StubInfo.id,
        name: device1StubInfo.name,
        serial: undefined,
        userId: device1StubInfo.user.id,
        topics: device1StubInfo.topics.name,
      });
    });

    it('should throw not found if device does not exist (Not found user)', async () => {
      // Act & Assert
      await expect(service.unregister(3, 1)).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            'Device with id 1 was not found for user with id 3',
          ),
        ),
      );
    });

    it('should throw not found if device does not exist (Not found device)', async () => {
      // Act & Assert
      await expect(service.unregister(1, 3)).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            'Device with id 3 was not found for user with id 1',
          ),
        ),
      );
    });

    it('should throw not found if requester is not the owner (Invalid owner)', async () => {
      // Act & Assert
      await expect(service.unregister(1, 2)).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            'Device with id 2 was not found for user with id 1',
          ),
        ),
      );
    });
  });

  describe('getDevicesList', () => {
    it('should return a list of devices registered by a requester', async () => {
      // Act & Assert
      expect(await service.getDevicesList(device1StubInfo.user.id)).toEqual([
        {
          id: device1StubInfo.id,
          name: device1StubInfo.name,
          serial: undefined,
          userId: device1StubInfo.user.id,
          topics: device1StubInfo.topics.name,
        },
      ]);
    });

    it('should return throw not found if requester has no devices registered', async () => {
      // Act & Assert
      await expect(service.getDevicesList(user3StubInfo.id)).rejects.toThrow(
        new RpcException(new NotFoundException('No devices found')),
      );
    });

    it('should throw not found if requester does not exist', async () => {
      await expect(service.getDevicesList(4)).rejects.toThrow(
        new RpcException(new NotFoundException('User not found')),
      );
    });
  });

  describe('addDeviceTopics', () => {
    it('should add topics to a device (input topics is a string)', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: device1StubInfo.id,
        topics: 'NewTopic7',
      };

      // Act & Assert
      expect(
        await service.addDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).toEqual({
        topicsAdded: 1,
        topics: [input.topics],
      });
    });

    it('should add topics to a device (input topics is an array)', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: device1StubInfo.id,
        topics: ['NewTopic8', 'NewTopic9'],
      };

      // Act & Assert
      expect(
        await service.addDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).toEqual({
        topicsAdded: 2,
        topics: input.topics,
      });
    });

    it('should throw bad request if all topics are already registered', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: device1StubInfo.id,
        topics: device1StubInfo.topics.name,
      };

      // Act & Assert
      await expect(
        service.addDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(
          new BadRequestException('Topics are already registered'),
        ),
      );
    });

    it('should throw not found if device does not exist (Not found user)', async () => {
      // Arrange
      const input = {
        requesterId: 4,
        deviceId: device1StubInfo.id,
        topics: ['NewTopic10'],
      };

      // Act & Assert
      await expect(
        service.addDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            `Device with id ${input.deviceId} was not found for user with id ${input.requesterId}`,
          ),
        ),
      );
    });

    it('should throw not found if device does not exist (Not found device)', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: 5,
        topics: ['NewTopic11'],
      };

      // Act & Assert
      await expect(
        service.addDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            `Device with id ${input.deviceId} was not found for user with id ${input.requesterId}`,
          ),
        ),
      );
    });

    it('should throw not found if device does not exist (Invalid owner)', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: device2StubInfo.id,
        topics: ['NewTopic12'],
      };

      // Act & Assert
      await expect(
        service.addDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            `Device with id ${input.deviceId} was not found for user with id ${input.requesterId}`,
          ),
        ),
      );
    });
  });

  describe('removeDeviceTopics', () => {
    it('should remove topics from a device (input topics is a string)', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: device1StubInfo.id,
        topics: device1StubInfo.topics.name[0],
      };

      // Act & Assert
      expect(
        await service.removeDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).toEqual({
        topicsRemoved: 1,
        topics: [device1StubInfo.topics.name[0]],
      });
    });

    it('should remove topics from a device (input topics is an array)', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: device1StubInfo.id,
        topics: device1StubInfo.topics.name,
      };

      // Act & Assert
      expect(
        await service.removeDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).toEqual({
        topicsRemoved: device1StubInfo.topics.name.length,
        topics: device1StubInfo.topics.name,
      });
    });

    it('should throw bad request if no topics to be removed', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: device1StubInfo.id,
        topics: device2StubInfo.topics.name,
      };

      // Act & Assert
      await expect(
        service.removeDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(new BadRequestException('Topics are not registered')),
      );
    });

    it('should throw not found if device does not exist (Not found user)', async () => {
      // Arrange
      const input = {
        requesterId: 3,
        deviceId: device1StubInfo.id,
        topics: device1StubInfo.topics.name,
      };

      // Act & Assert
      await expect(
        service.removeDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            `Device with id ${input.deviceId} was not found for user with id ${input.requesterId}`,
          ),
        ),
      );
    });

    it('should throw not found if device does not exist (Not found device)', async () => {
      // Arrange
      const input = {
        requesterId: device1StubInfo.user.id,
        deviceId: 3,
        topics: device1StubInfo.topics.name,
      };

      // Act & Assert
      await expect(
        service.removeDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            `Device with id ${input.deviceId} was not found for user with id ${input.requesterId}`,
          ),
        ),
      );
    });

    it('should throw not found if device does not exist (Invalid owner)', async () => {
      const input = {
        requesterId: device2StubInfo.user.id,
        deviceId: device1StubInfo.id,
        topics: device1StubInfo.topics.name,
      };

      await expect(
        service.removeDeviceTopics(
          input.requesterId,
          input.deviceId,
          input.topics,
        ),
      ).rejects.toThrow(
        new RpcException(
          new NotFoundException(
            `Device with id ${input.deviceId} was not found for user with id ${input.requesterId}`,
          ),
        ),
      );
    });
  });
});
