export class UsersRepositoryMock {
  static build() {
    return {
      findOneByOrFail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(null),
      save: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(null),
    };
  }
}
