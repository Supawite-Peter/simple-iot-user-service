export class DevicesServiceMock {
  static build() {
    return {
      register: jest.fn().mockResolvedValue('Register Received'),
      unregister: jest.fn().mockResolvedValue('Unregister Received'),
      getDevicesList: jest.fn().mockResolvedValue('Get Devices List Received'),
      addDeviceTopics: jest.fn().mockResolvedValue('Add Device Topic Received'),
      removeDeviceTopics: jest
        .fn()
        .mockResolvedValue('Remove Device Topic Received'),
      checkDeviceTopic: jest
        .fn()
        .mockResolvedValue('Check Device Topic Received'),
    };
  }
}
