import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DevicesServiceMock } from './mocks/devices.service.mock';

describe('DevicesController', () => {
  let controller: DevicesController;
  let service: DevicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
    })
      .useMocker((token) => {
        switch (token) {
          case DevicesService:
            return DevicesServiceMock.build();
        }
      })
      .compile();

    controller = module.get<DevicesController>(DevicesController);
    service = module.get<DevicesService>(DevicesService);
  });

  it('should be define', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('devices.register', () => {
    it('should pass data to DevicesService.register', async () => {
      // Arrange
      const input = {
        userId: 1,
        deviceName: 'device1',
        deviceTopics: ['topic1'],
      };

      // Act
      const result = await controller.register(input);

      // Assert
      expect(result).toEqual('Register Received');
      expect(service.register).toHaveBeenCalled();
    });
  });

  describe('devices.unregister', () => {
    it('should pass data to DevicesService.unregister', async () => {
      // Arrange
      const input = {
        userId: 1,
        deviceId: 1,
      };

      // Act
      const result = await controller.unregister(input);

      // Assert
      expect(result).toEqual('Unregister Received');
      expect(service.unregister).toHaveBeenCalled();
    });
  });

  describe('devices.list', () => {
    it('should pass data to DevicesService.getDevicesList', async () => {
      // Arrange
      const input = {
        userId: 1,
      };

      // Act
      const result = await controller.list(input);

      // Assert
      expect(result).toEqual('Get Devices List Received');
      expect(service.getDevicesList).toHaveBeenCalled();
    });
  });

  describe('devices.topics.add', () => {
    it('should pass data to DevicesService.addDeviceTopics', async () => {
      // Arrange
      const input = {
        userId: 1,
        deviceId: 1,
        deviceTopics: ['topic1'],
      };

      // Act
      const result = await controller.addTopics(input);

      // Assert
      expect(result).toEqual('Add Device Topic Received');
      expect(service.addDeviceTopics).toHaveBeenCalled();
    });
  });

  describe('devices.topics.remove', () => {
    it('should pass data to DevicesService.removeDeviceTopics', async () => {
      // Arrange
      const input = {
        userId: 1,
        deviceId: 1,
        deviceTopics: ['topic1'],
      };

      // Act
      const result = await controller.removeTopics(input);

      // Assert
      expect(result).toEqual('Remove Device Topic Received');
      expect(service.removeDeviceTopics).toHaveBeenCalled();
    });
  });
});
