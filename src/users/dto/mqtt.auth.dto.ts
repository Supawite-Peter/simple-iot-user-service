import { IsNotEmpty } from 'class-validator';

export class MqttAuthDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;
}

export class MqttAuthResultDto {
  result: string;
}
