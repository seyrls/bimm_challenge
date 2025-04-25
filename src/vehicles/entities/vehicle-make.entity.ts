import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleType } from './vehicle-type.entity';

@Entity('vehicle_makes')
export class VehicleMake {
  @PrimaryColumn()
  makeId: number;

  @Column()
  makeName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => VehicleType, (type) => type.make, {
    cascade: true,
    eager: true,
  })
  vehicleTypes: VehicleType[];
}
