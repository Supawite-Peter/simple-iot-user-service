import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Topic } from './topic.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 15 })
  name: string;

  @Column('varchar', { length: 50, nullable: true })
  serial: string;

  @ManyToOne(() => User, (user) => user.devices, {
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => Topic, (topic) => topic.device, {
    cascade: true,
  })
  topics: Topic[];
}
