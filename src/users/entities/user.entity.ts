import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

@Entity()
@Index(['firstName', 'lastName'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 30, nullable: true })
  firstName: string;

  @Column('varchar', { length: 30, nullable: true })
  lastName: string;

  @Column('varchar', { length: 15, unique: true })
  username: string;

  @Column('varchar', { length: 60 })
  passwordHash: string;

  @Column('varchar', { length: 60, nullable: true })
  mqttPasswordHash: string;

  @OneToMany(() => Device, (device) => device.user, {
    cascade: true,
    nullable: true,
  })
  devices: Device[];
}
