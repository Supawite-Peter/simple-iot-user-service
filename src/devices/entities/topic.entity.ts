import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Device } from './device.entity';
@Entity()
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 15 })
  name: string;

  @Column('varchar', { length: 10, nullable: true })
  unit: string;

  @Column('datetime', {
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  lastUpdate: string;

  @ManyToOne(() => Device, (device) => device.topics, {
    onDelete: 'CASCADE',
  })
  device: Device;
}
