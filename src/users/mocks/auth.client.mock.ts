import { of } from 'rxjs';

export class AuthClientMock {
  accessTokenStub: string;
  refreshTokenStub: string;
  error: any;

  constructor(accessTokenStub?: string, refreshTokenStub?: string) {
    this.accessTokenStub = accessTokenStub;
    this.refreshTokenStub = refreshTokenStub;
  }

  build() {
    return {
      send: jest
        .fn()
        .mockImplementation((pattern, payload) => this.send(pattern, payload)),
    };
  }

  send(pattern: any, payload: any) {
    if (this.error) throw this.error;
    if (pattern.cmd === 'auth.token.sign') {
      switch (payload.type) {
        case 'access':
          return of({
            user: { sub: payload.userId, username: payload.username },
            token: this.accessTokenStub,
          });
        case 'refresh':
          return of({
            user: { sub: payload.userId, username: payload.username },
            token: this.refreshTokenStub,
          });
      }
    }
  }
}
