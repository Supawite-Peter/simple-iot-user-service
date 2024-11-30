import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserDetail } from './interfaces/users.interface';
import { TokenDetail } from './interfaces/token.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('AUTH_SERVICE') private authService: ClientProxy,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  /**
   * Signs in a user.
   * @param username The username
   * @param password The password
   * @returns JWT token
   * @throws InternalServerErrorException if username or password is undefined
   * @throws NotFoundException if the user does not exist
   * @throws UnauthorizedException if the password is incorrect
   */
  async signIn(username: string, password: string): Promise<TokenDetail> {
    // Check if username and password are defined
    if (!username || !password)
      throw new RpcException(
        new InternalServerErrorException('Undefined username or password'),
      );

    // Check if user exists
    const user = await this.findUsername(username);
    if (!user)
      throw new RpcException(new NotFoundException("User doesn't exist"));

    // Check user hash
    if (!(await this.checkHash(password, user.passwordHash)))
      throw new RpcException(new UnauthorizedException('Incorrect password'));

    // Request for JWT token
    try {
      const pattern = { cmd: 'auth.token.sign' };
      const accessToken = await firstValueFrom(
        this.authService.send(pattern, {
          userId: user.id,
          username: user.username,
          type: 'access',
        }),
      );
      const refreshToken = await firstValueFrom(
        this.authService.send(pattern, {
          userId: user.id,
          username: user.username,
          type: 'refresh',
        }),
      );

      // Return JWT token with user details
      return {
        user: accessToken.user,
        token: {
          accessToken: accessToken.token,
          refreshToken: refreshToken.token,
        },
      };
    } catch {
      throw new RpcException(
        new InternalServerErrorException('Unable to sign JWT token'),
      );
    }
  }

  /**
   * Registers a user.
   * @param username The username
   * @param password The password
   * @returns User detail of the registered user
   * @throws InternalServerErrorException if username or password is undefined
   * @throws ConflictException if the username already exists
   */
  async register(username: string, password: string): Promise<UserDetail> {
    // Check if username and password are defined
    if (username === undefined || password === undefined)
      throw new RpcException(
        new InternalServerErrorException('Undefined username or password'),
      );

    // Check if username already exists
    if (await this.findUsername(username))
      throw new RpcException(new ConflictException('Username already exists'));

    // Register user
    const user = this.usersRepository.create({
      username: username,
      passwordHash: await bcrypt.hash(password, 10),
    });
    await this.usersRepository.save(user);

    return this.prepareUserDetails(user);
  }

  /**
   * Unregisters a user.
   * @param userId The user id of the user
   * @param password The password
   * @returns User detail of the unregistered user
   * @throws InternalServerErrorException if username or password is undefined
   * @throws NotFoundException if the user does not exist
   * @throws UnauthorizedException if the password is incorrect
   */
  async unregister(userId: number, password: string): Promise<UserDetail> {
    // Check if username and password are defined
    if (userId === undefined || password === undefined)
      throw new RpcException(
        new InternalServerErrorException('Undefined username or password'),
      );

    // Check if user exists
    const user = await this.findUserId(userId);
    if (!user)
      throw new RpcException(new NotFoundException('User does not exist'));

    // Check password
    if (!(await this.checkHash(password, user.passwordHash)))
      throw new RpcException(new UnauthorizedException('Incorrect password'));

    // Delete user
    await this.usersRepository.remove(user);

    return this.prepareUserDetails(user, userId);
  }

  /**
   * Get user details by id.
   * @param userId The id of the user
   * @returns User detail of the user
   * @throws NotFoundException if the user does not exist
   */
  async getUserDetails(userId: number): Promise<UserDetail> {
    // Get user record
    const user = await this.findUserId(userId);

    // Throw NotFoundException if user does not exist
    if (!user)
      throw new RpcException(new NotFoundException('User does not exist'));

    // Prepare user details
    return this.prepareUserDetails(user);
  }

  /**
   * Find a user by username.
   * @param targetName The target username
   * @returns The user if found, undefined otherwise
   */
  async findUsername(targetName: string): Promise<User | undefined> {
    return this.usersRepository
      .findOneByOrFail({ username: targetName })
      .catch(() => undefined);
  }

  /**
   * Find a user by id.
   * @param targetId The target id of the user
   * @returns The user if found, undefined otherwise
   */
  async findUserId(targetId: number): Promise<User | undefined> {
    return this.usersRepository
      .findOneByOrFail({ id: targetId })
      .catch(() => undefined);
  }

  /**
   * Check if a password matches a hash.
   * @param password The password to check
   * @param hash The hash to compare with
   * @returns True if the password matches the hash, false otherwise
   */
  async checkHash(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Prepare user details to return to the client.
   * @param user The user from which to prepare the details
   * @param id Optional id to use instead of the user's id
   * @returns User detail object
   */
  private prepareUserDetails(user: User, id?: number): UserDetail {
    return {
      id: user.id ? user.id : id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };
  }
}
