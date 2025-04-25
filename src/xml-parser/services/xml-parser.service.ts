import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { Parser } from 'xml2js';
import { stripPrefix } from 'xml2js/lib/processors';
import {
  AllVehicleMakes,
  VehicleType,
  VehicleMakeType,
} from '../interfaces/vehicle.interface';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class XmlParserService {
  // private readonly logger = new Logger(XmlParserService.name);
  stripPrefixProcessor = stripPrefix as (
    node: any,
    parent: any,
    index: number,
    name: string,
  ) => any;

  private readonly parser = new Parser({
    explicitArray: false,
    mergeAttrs: true,
    explicitRoot: false,
    tagNameProcessors: [stripPrefix],
  });

  constructor(private readonly logger: Logger) {
    this.logger.log('XML Parser Service Initialized');
  }

  async getAllMakes(): Promise<AllVehicleMakes[]> {
    try {
      const response = await axios.get(
        'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=xml',
      );

      const parsedData = (await this.parser.parseStringPromise(
        response.data as string,
      )) as {
        Results: { AllVehicleMakes?: AllVehicleMakes[] | AllVehicleMakes };
      };
      const makes = parsedData.Results.AllVehicleMakes ?? [];

      return Array.isArray(makes) ? makes : [makes];
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during Makes XML parsing';

      this.logger.error(
        error,
        `Error fatching data and parsing Makes XML: ${errorMessage}`,
      );
      throw new Error(errorMessage);
    }
  }

  async getVehicleTypesForMake(makeId: string): Promise<VehicleType[]> {
    try {
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=xml`,
      );

      const parsedData = (await this.parser.parseStringPromise(
        response.data as string,
      )) as { Results: { VehicleTypesForMakeIds?: VehicleType[] } };

      const vehicleTypes = parsedData.Results.VehicleTypesForMakeIds || [];

      return Array.isArray(vehicleTypes) ? vehicleTypes : [vehicleTypes];
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during Vehicle Types XML parsing';
      this.logger.error(
        error,
        `Error fatching data and parsing Vehicle Types XML: ${errorMessage}`,
      );
      throw new Error(errorMessage);
    }
  }

  async transformData(): Promise<VehicleMakeType[]> {
    this.logger.log('Starting data transformation...');
    // CALLS_PER_MINUTE_LIMIT = 1000;
    /*
    * These limit is based on what NHTSA website says:
    Is there a limit on the amount of queries that can be made to the Vehicle API actions per day?
    - No there is no limit to the amount of actions that can be run on the API per day
    - This said, this is a public resource so if you are planning on large batch processes we ask that you time them either at night (based on EST, or on the weekend).
    - During the normal week, we can easily handle between 1000 – 2000 transactions / minute on the servers. We have not reached an upper limit at this time.
    */
    const BATCH_SIZE = 10; //how many calls to GetVehicleTypesForMakeId API
    const DELAY_BETWEEN_BATCHES_MS = 3000; //milliseconds between the calls

    try {
      const makes = await this.getAllMakes();

      const allResults: { make: AllVehicleMakes; types: VehicleType[] }[] = [];
      let processedCount = 0;

      for (let i = 0; i < makes.length; i += BATCH_SIZE) {
        const batchMakes = makes.slice(i, i + BATCH_SIZE);
        this.logger.log(
          `Processing batch # ${i / BATCH_SIZE + 1} (Makes ${i + 1} to ${Math.min(i + BATCH_SIZE, makes.length)})...`,
        );

        const batchPromises = batchMakes.map((make) =>
          this.getVehicleTypesForMake(make.Make_ID.toString())
            .then((types) => ({ make, types }))
            .catch((error) => {
              this.logger.error(
                `Failed to fetch types for make ${make.Make_Name} and ID: ${make.Make_ID}. Error: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
              return { make, types: [] };
            }),
        );

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);
        processedCount += batchMakes.length;

        this.logger.log(
          `Batch ${i / BATCH_SIZE + 1} completed. Processed total of ${processedCount}/${makes.length} makes.`,
        );

        if (i + BATCH_SIZE < makes.length) {
          this.logger.log(
            `Waiting for ${DELAY_BETWEEN_BATCHES_MS / 1000} seconds before the next batch. Please, wait`,
          );
          await delay(DELAY_BETWEEN_BATCHES_MS);
        }
      }

      this.logger.log('Fetched all the vehicle types.');

      const processedData = allResults.map((result) => {
        const mappedVehicleTypes = result.types.map((vType) => ({
          typeId: vType.VehicleTypeId,
          typeName: vType.VehicleTypeName,
        }));

        return {
          makeId: result.make.Make_ID,
          makeName: result.make.Make_Name,
          vehicleTypes: mappedVehicleTypes,
        };
      });

      this.logger.log('Parsed and transformed data');

      return processedData;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during data transformation';
      this.logger.error(error, `Failed to transform data: ${errorMessage}`);
      throw error;
    }
  }
}
