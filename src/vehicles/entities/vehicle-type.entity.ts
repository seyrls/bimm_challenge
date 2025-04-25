import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleMake } from './vehicle-make.entity';

@Entity('vehicle_types')
export class VehicleType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  typeId: number;

  @Column()
  typeName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => VehicleMake, (make) => make.vehicleTypes)
  @JoinColumn({ name: 'makeId' })
  make: VehicleMake;

  @Column()
  makeId: number;
}
