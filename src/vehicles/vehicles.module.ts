import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleMake } from './entities/vehicle-make.entity';
import { VehicleType } from './entities/vehicle-type.entity';
import { VehicleService } from './services/vehicle.service';
import { VehicleResolver } from './resolvers/vehicle.resolver';
import { XmlParserModule } from 'src/xml-parser/xml-parser.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleMake, VehicleType]),
    XmlParserModule,
  ],
  providers: [VehicleService, VehicleResolver],
  exports: [VehicleService],
})
export class VehiclesModule {}
