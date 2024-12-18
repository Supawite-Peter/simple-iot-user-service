import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersRepositoryMock } from './mocks/users.repository.mock';
import { AuthClientMock } from './mocks/auth.client.mock';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserStubHepler } from './mocks/helper/create.user.stub.helper';
import { UserStubInfo } from './mocks/interfaces/user.stub.info';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let authClientMock: AuthClientMock;

  // Test constants
  const TEST_PASS = 'password',
    TEST_CORRECT_HASH =
      '$2b$10$Inn9wpTrqat5FsaLrARlsetYMzsYVRrTi7QGRmL/iQKi5RXlbW7rS',
    TEST_WRONG_HASH = 'wrongpassword';

  beforeEach(async () => {
    authClientMock = new AuthClientMock();

    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: UsersRepositoryMock.build(),
        },
        {
          provide: 'AUTH_SERVICE',
          useValue: authClientMock.build(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access and refresh token if user exists and password is correct', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        passwordHash: TEST_CORRECT_HASH,
      } as UserStubInfo;
      authClientMock.accessTokenStub = 'access_token';
      authClientMock.refreshTokenStub = 'refresh_token';
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValue(CreateUserStubHepler.createUserStub(userStub));

      // Act
      const result = await service.signIn(userStub.username, TEST_PASS);

      // Assert
      expect(result).toEqual({
        user: { sub: userStub.id, username: userStub.username },
        token: { accessToken: 'access_token', refreshToken: 'refresh_token' },
      });
    });

    it('should throw internal exception if unable to sign jwt token', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        passwordHash: TEST_CORRECT_HASH,
      } as UserStubInfo;
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValue(CreateUserStubHepler.createUserStub(userStub));
      authClientMock.error = RpcException;

      // Act & Assert
      await expect(
        service.signIn(userStub.username, TEST_PASS),
      ).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Unable to sign JWT token'),
        ),
      );
    });

    it('should throw not found exception if user does not exist', async () => {
      // Act & Assert
      await expect(service.signIn('notexist', 'password')).rejects.toThrow(
        new RpcException(new NotFoundException("User doesn't exist")),
      );
    });

    it('should throw unauthorized exception if password is incorrect', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        passwordHash: TEST_CORRECT_HASH,
      } as UserStubInfo;
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValue(CreateUserStubHepler.createUserStub(userStub));

      // Act & Assert
      await expect(
        service.signIn(userStub.username, 'wrongpassword'),
      ).rejects.toThrow(
        new RpcException(new UnauthorizedException('Incorrect password')),
      );
    });

    it('should throw internal exception if input username is undefined', async () => {
      await expect(service.signIn('', 'password')).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });

    it('should throw exception if input password is undefined', async () => {
      await expect(service.signIn('exist', '')).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });

    it('should throw exception if both username and password are undefined', async () => {
      await expect(service.signIn('', '')).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });
  });

  describe('register', () => {
    beforeEach(() => {
      // Mock bcrypt hashing
      jest.clearAllMocks();
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => TEST_CORRECT_HASH);
    });

    it('should add a new user to the service', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        firstName: 'test',
        lastName: 'test',
        passwordHash: TEST_CORRECT_HASH,
      };
      jest
        .spyOn(userRepository, 'create')
        .mockReturnValueOnce(userStub as User);

      // Act & Assert
      expect(await service.register(userStub.username, TEST_PASS)).toEqual({
        id: userStub.id,
        username: userStub.username,
        firstName: userStub.firstName,
        lastName: userStub.lastName,
      });
    });

    it('should throw conflict exception if username already exists', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        firstName: 'test',
        lastName: 'test',
        passwordHash: TEST_CORRECT_HASH,
      };
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(userStub as any);

      // Act & Assert
      await expect(
        service.register(userStub.username, TEST_PASS),
      ).rejects.toThrow(
        new RpcException(new ConflictException('Username already exists')),
      );
    });

    it('should throw internal exception if input username is undefined', async () => {
      // Act & Assert
      await expect(service.register(undefined, TEST_PASS)).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });

    it('should throw internal exception if input password is undefined', async () => {
      // Act & Assert
      await expect(service.register('test_user', undefined)).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });

    it('should throw internal exception if both input username and password are undefined', async () => {
      // Act & Assert
      await expect(service.register(undefined, undefined)).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });
  });

  describe('unregister', () => {
    it('should remove a user from the service', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        firstName: 'test',
        lastName: 'test',
        passwordHash: TEST_CORRECT_HASH,
      };
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(userStub as User);

      // Act & Assert
      expect(await service.unregister(userStub.id, TEST_PASS)).toEqual({
        id: userStub.id,
        username: userStub.username,
        firstName: userStub.firstName,
        lastName: userStub.lastName,
      });
    });

    it('should throw an not found exception if user does not exist', async () => {
      // Act & Assert
      await expect(service.unregister(99, TEST_PASS)).rejects.toThrow(
        new RpcException(new NotFoundException('User does not exist')),
      );
    });

    it('should throw an unauthorized exception if password is incorrect', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        firstName: 'test',
        lastName: 'test',
        passwordHash: TEST_WRONG_HASH,
      };
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(userStub as User);

      // Act & Assert
      await expect(service.unregister(userStub.id, TEST_PASS)).rejects.toThrow(
        new RpcException(new UnauthorizedException('Incorrect password')),
      );
    });

    it('should throw internal exception if input username is undefined', async () => {
      // Act & Assert
      await expect(service.unregister(undefined, TEST_PASS)).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });

    it('should throw internal exception if both input password is undefined', async () => {
      // Act & Assert
      await expect(service.unregister(1, undefined)).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });

    it('should throw internal exception if both input username and password are undefined', async () => {
      // Act & Assert
      await expect(service.unregister(undefined, undefined)).rejects.toThrow(
        new RpcException(
          new InternalServerErrorException('Undefined username or password'),
        ),
      );
    });
  });

  describe('getUserDetails', () => {
    it('should return user details (id)', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        firstName: 'test',
        lastName: 'test',
        passwordHash: TEST_CORRECT_HASH,
      };
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(userStub as User);

      // Act & Assert
      expect(await service.getUserDetails(userStub.id)).toEqual({
        id: userStub.id,
        username: userStub.username,
        firstName: userStub.firstName,
        lastName: userStub.lastName,
      });
    });

    it('should return user details (username)', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        firstName: 'test',
        lastName: 'test',
        passwordHash: TEST_CORRECT_HASH,
      };
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(userStub as User);

      // Act & Assert
      expect(await service.getUserDetails(userStub.username)).toEqual({
        id: userStub.id,
        username: userStub.username,
        firstName: userStub.firstName,
        lastName: userStub.lastName,
      });
    });

    describe('mqttAuth', () => {
      it('should return result = allow if username and password are correct (mqtt password not set)', async () => {
        // Arrange
        const userStub = {
          id: 1,
          username: 'test_user',
          passwordHash: TEST_CORRECT_HASH,
          mqttPasswordHash: null,
        } as UserStubInfo;
        jest
          .spyOn(userRepository, 'findOneByOrFail')
          .mockResolvedValue(CreateUserStubHepler.createUserStub(userStub));

        // Act
        const result = await service.mqttAuth({
          username: userStub.username,
          password: TEST_PASS,
        });

        // Assert
        expect(result).toEqual({
          result: 'allow',
        });
      });

      it('should return result = allow if username and password are correct (mqtt password set)', async () => {
        // Arrange
        const userStub = {
          id: 1,
          username: 'test_user',
          passwordHash: TEST_WRONG_HASH,
          mqttPasswordHash: TEST_CORRECT_HASH,
        } as UserStubInfo;
        jest
          .spyOn(userRepository, 'findOneByOrFail')
          .mockResolvedValue(CreateUserStubHepler.createUserStub(userStub));

        // Act
        const result = await service.mqttAuth({
          username: userStub.username,
          password: TEST_PASS,
        });

        // Assert
        expect(result).toEqual({
          result: 'allow',
        });
      });

      it('should return result = deny if password is incorrect (mqtt password not set)', async () => {
        // Arrange
        const userStub = {
          id: 1,
          username: 'test_user',
          passwordHash: TEST_WRONG_HASH,
          mqttPasswordHash: null,
        } as UserStubInfo;
        jest
          .spyOn(userRepository, 'findOneByOrFail')
          .mockResolvedValue(CreateUserStubHepler.createUserStub(userStub));

        // Act
        const result = await service.mqttAuth({
          username: userStub.username,
          password: TEST_PASS,
        });

        // Assert
        expect(result).toEqual({
          result: 'deny',
        });
      });

      it('should return result = deny if password is incorrect (mqtt password set)', async () => {
        // Arrange
        const userStub = {
          id: 1,
          username: 'test_user',
          passwordHash: TEST_CORRECT_HASH,
          mqttPasswordHash: TEST_WRONG_HASH,
        } as UserStubInfo;
        jest
          .spyOn(userRepository, 'findOneByOrFail')
          .mockResolvedValue(CreateUserStubHepler.createUserStub(userStub));

        // Act
        const result = await service.mqttAuth({
          username: userStub.username,
          password: TEST_PASS,
        });

        // Assert
        expect(result).toEqual({
          result: 'deny',
        });
      });

      it('should return result = deny if username is undefined', async () => {
        // Act & Assert
        expect(
          await service.mqttAuth({
            username: undefined,
            password: 'some_password',
          }),
        ).toEqual({
          result: 'deny',
        });
      });

      it('should return result = deny if password is undefined', async () => {
        // Act & Assert
        expect(
          await service.mqttAuth({
            username: 'some_username',
            password: undefined,
          }),
        ).toEqual({
          result: 'deny',
        });
      });

      it('should return result = deny if user does not exist', async () => {
        // Act
        const result = await service.mqttAuth({
          username: 'test_user',
          password: TEST_PASS,
        });

        // Assert
        expect(result).toEqual({
          result: 'deny',
        });
      });
    });

    it('should return not found exception if user does not exist', async () => {
      // Act & Assert
      await expect(service.getUserDetails(99)).rejects.toThrow(
        new RpcException(new NotFoundException('User does not exist')),
      );
    });
  });

  describe('findUsername', () => {
    it('should return user by username', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        passwordHash: TEST_CORRECT_HASH,
      };
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(userStub as User);

      // Act & Assert
      expect(await service.findUsername(userStub.username)).toEqual(userStub);
    });

    it('should return undefined if user does not exist', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOneByOrFail').mockRejectedValueOnce(null);

      // Act & Assert
      expect(await service.findUsername('notexist')).toBeUndefined();
    });

    it('should return undefined if input username is undefined', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOneByOrFail').mockRejectedValueOnce(null);

      // Act & Assert
      expect(await service.findUsername(undefined)).toBeUndefined();
    });
  });

  describe('findUserId', () => {
    it('should return user by userId', async () => {
      // Arrange
      const userStub = {
        id: 1,
        username: 'test_user',
        passwordHash: TEST_CORRECT_HASH,
      };
      jest
        .spyOn(userRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(userStub as any);

      // Act & Assert
      expect(await service.findUserId(1)).toEqual(userStub);
    });

    it('should return undefined if user id does not exist', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOneByOrFail').mockRejectedValueOnce(null);

      // Act & Assert
      expect(await service.findUserId(2)).toBeUndefined();
    });

    it('should return undefined if input userId is undefined', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOneByOrFail').mockRejectedValueOnce(null);

      // Act & Assert
      expect(await service.findUserId(undefined)).toBeUndefined();
    });
  });
});
