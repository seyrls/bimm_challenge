import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { VehicleService } from './vehicles/services/vehicle.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const vehicleService = app.get(VehicleService);

  try {
    logger.log('Initializing TypeORM connection...');
    await app.init();

    logger.log('Waiting for database connection...');
    //await new Promise((resolve) => setTimeout(resolve, 5000));

    logger.log('Starting sync service...');
    await vehicleService.syncData();
    logger.log('Vehicle data synced successfully.');

    // logger.log('Starting sync service.');
    // await vehicleService.syncData();
    // logger.log('Vehicle data synced successfully.');
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during vehicle data sync';
    logger.error(`Failed syncing vehicle data: ${errorMessage}`);
  }

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
