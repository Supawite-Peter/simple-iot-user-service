import { UserStubInfo } from '../../users/mocks/interfaces/user.stub.info';
import { CreateDeviceStubHepler } from './helper/create.device.stub.helper';

export class UsersServiceMock {
  usersInfo: UserStubInfo[];

  constructor(usersDetail: UserStubInfo[]) {
    this.usersInfo = usersDetail;
  }

  build() {
    return {
      findUserId: jest
        .fn()
        .mockImplementation((userId) => this.findUserId(userId)),
    };
  }

  findUserId(userId: number) {
    const result = this.usersInfo.filter((user) => user.id === userId);

    return result.length === 0
      ? Promise.resolve(undefined)
      : Promise.resolve(CreateDeviceStubHepler.createUserStub(result[0]));
  }
}
