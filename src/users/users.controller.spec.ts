import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersServiceMock } from './mocks/users.service.mock';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    })
      .useMocker((token) => {
        switch (token) {
          case UsersService:
            return UsersServiceMock.build();
        }
      })
      .compile();
    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('users.signin', () => {
    it('should pass username and password to UsersService.signIn', async () => {
      expect(
        await controller.signIn({
          username: 'user',
          password: 'pass',
        }),
      ).toEqual('Signin Received');
      expect(service.signIn).toHaveBeenCalled();
    });
  });

  describe('users.register', () => {
    it('should pass username and password to UsersService.register', async () => {
      expect(
        await controller.register({
          username: 'user',
          password: 'pass',
        }),
      ).toEqual('Register Received');
      expect(service.register).toHaveBeenCalled();
    });
  });

  describe('users.unregister', () => {
    it('should pass username and password to UsersService.unregister', async () => {
      expect(
        await controller.unregister({
          userId: 1,
          password: 'pass',
        }),
      ).toEqual('Unregister Received');
      expect(service.unregister).toHaveBeenCalled();
    });
  });

  describe('users.details', () => {
    it('should pass userId to UsersService.getUserDetails', async () => {
      expect(await controller.getUserDetails(1)).toEqual(
        'getUserDetails Received',
      );
      expect(service.getUserDetails).toHaveBeenCalledTimes(1);
    });
  });
});
