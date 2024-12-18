import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  HttpCode,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { MqttAuthDto } from './dto/mqtt.auth.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @MessagePattern({ cmd: 'users.signin' })
  signIn(
    @Payload() { username, password }: { username: string; password: string },
  ) {
    return this.usersService.signIn(username, password);
  }

  @MessagePattern({ cmd: 'users.register' })
  register(
    @Payload() { username, password }: { username: string; password: string },
  ) {
    return this.usersService.register(username, password);
  }

  @MessagePattern({ cmd: 'users.unregister' })
  unregister(
    @Payload() { userId, password }: { userId: number; password: string },
  ) {
    return this.usersService.unregister(userId, password);
  }

  @MessagePattern({ cmd: 'users.details' })
  getUserDetails(@Payload() { userId }: { userId: number }) {
    // To Do: add cache
    return this.usersService.getUserDetails(userId);
  }

  @MessagePattern({ cmd: 'users.details.by.name' })
  getUserDetailsByName(@Payload() { username }: { username: string }) {
    // To Do: add cache
    return this.usersService.getUserDetails(username);
  }

  @Post('mqtt/auth')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async mqttAuth(@Body() mqttAuthDto: MqttAuthDto) {
    return this.usersService.mqttAuth(mqttAuthDto);
  }
}
