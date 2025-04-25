import { Resolver, Query } from '@nestjs/graphql';
import { VehicleService } from '../services/vehicle.service';

@Resolver('Vehicle')
export class VehicleResolver {
  constructor(private readonly vehicleService: VehicleService) {}

  @Query('vehicleMakes')
  async getVehicleMakes() {
    return this.vehicleService.getFormattedVehicleData();
  }
}
