import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleMake } from '../entities/vehicle-make.entity';
import { VehicleType } from '../entities/vehicle-type.entity';
import { XmlParserService } from 'src/xml-parser/services/xml-parser.service';
import { VehicleMakeType } from 'src/xml-parser/interfaces/vehicle.interface';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    @InjectRepository(VehicleMake)
    private vehicleMakeRepository: Repository<VehicleMake>,
    @InjectRepository(VehicleType)
    private vehicleTypeRepository: Repository<VehicleType>,
    private xmlParserService: XmlParserService,
  ) {}

  async syncData(): Promise<void> {
    try {
      this.logger.log('Starting data sync...');
      await this.vehicleMakeRepository.count().then((count) => {
        if (count > 0) {
          this.logger.log('Data already exists in the database.');
          return;
        }
      });

      const transformedData = await this.xmlParserService.transformData();

      if (!Array.isArray(transformedData)) {
        this.logger.error('Invalid transformed data received');
      }

      for (const parsedData of transformedData) {
        const make = new VehicleMake();
        make.makeId = parsedData.makeId;
        make.makeName = parsedData.makeName;

        make.vehicleTypes = parsedData.vehicleTypes.map(
          (vType: { typeId: number; typeName: string }) => {
            const vehicleType = new VehicleType();
            vehicleType.typeId = vType.typeId;
            vehicleType.typeName = vType.typeName;
            vehicleType.makeId = parsedData.makeId;
            return vehicleType;
          },
        );

        await this.vehicleMakeRepository.save(make);
      }

      this.logger.log('Data sync completed.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during vehicle data sync';
      this.logger.error(`Data sync failed savind to DB: ${errorMessage}`);

      throw error;
    }
  }

  async getFormattedVehicleData(): Promise<VehicleMakeType[]> {
    const makes = await this.vehicleMakeRepository.find({
      relations: ['vehicleTypes'],
    });

    return makes.map((make) => ({
      makeId: make.makeId,
      makeName: make.makeName,
      vehicleTypes: make.vehicleTypes.map((vType) => ({
        typeId: vType.typeId,
        typeName: vType.typeName,
      })),
    }));
  }
}
