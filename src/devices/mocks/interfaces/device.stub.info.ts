import { UserStubInfo } from '../../../users/mocks/interfaces/user.stub.info';

export interface DeviceStubInfo {
  id: number;
  name: string;
  topics: {
    id: number[];
    name: string[];
  };
  user: UserStubInfo;
}
