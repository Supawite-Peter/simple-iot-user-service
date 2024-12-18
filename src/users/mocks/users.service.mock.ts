export class UsersServiceMock {
  static build() {
    return {
      signIn: jest.fn().mockResolvedValue('Signin Received'),
      register: jest.fn().mockResolvedValue('Register Received'),
      unregister: jest.fn().mockResolvedValue('Unregister Received'),
      getUserDetails: jest.fn().mockResolvedValue('getUserDetails Received'),
      mqttAuth: jest.fn().mockResolvedValue('mqttAuth Received'),
    };
  }
}
