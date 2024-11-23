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

  async signIn(username: string, password: string): Promise<TokenDetail> {
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

    // Generate JWT
    const payload = { userId: user.id, username: user.username };
    const pattern = { cmd: 'auth.token.sign' };
    return {
      accessToken: await firstValueFrom(
        this.authService.send(pattern, payload),
      ),
    };
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

    return this.getUserDetails(user);
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

    return this.getUserDetails(user, userId);
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

  private getUserDetails(user: User, id?: number): UserDetail {
    return {
      id: user.id ? user.id : id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };
  }
}
