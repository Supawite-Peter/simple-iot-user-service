import { UserStubInfo } from '../interfaces/user.stub.info';
import { User } from '../../../users/entities/user.entity';

export class CreateUserStubHepler {
  static createUserStub(info: UserStubInfo): User {
    const user = new User();
    user.id = info.id;
    user.username = info.username;
    user.passwordHash = info.passwordHash;
    user.mqttPasswordHash = info.mqttPasswordHash;
    user.firstName = info.firstName;
    user.lastName = info.lastName;
    return user;
  }
}
