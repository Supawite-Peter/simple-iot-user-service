import { of } from 'rxjs';

export class AuthClientMock {
  token: string;

  constructor(token?: string) {
    this.token = token;
  }

  build() {
    return {
      send: jest.fn().mockImplementation(() => of(this.token)),
    };
  }
}
