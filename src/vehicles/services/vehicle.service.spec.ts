import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleMake } from '../entities/vehicle-make.entity';
import { VehicleType } from '../entities/vehicle-type.entity';
import { XmlParserService } from '../../xml-parser/services/xml-parser.service';

// Mock repository factory
const mockRepository = () => ({
  find: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
});

describe('VehicleService', () => {
  let service: VehicleService;
  let vehicleMakeRepository: jest.Mocked<Repository<VehicleMake>>;
  let vehicleTypeRepository: jest.Mocked<Repository<VehicleType>>;
  let xmlParserService: jest.Mocked<XmlParserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        {
          provide: getRepositoryToken(VehicleMake),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(VehicleType),
          useFactory: mockRepository,
        },
        {
          provide: XmlParserService,
          useFactory: () => ({
            transformData: jest.fn(),
            getAllMakes: jest.fn(),
            getVehicleTypesForMake: jest.fn(),
          }),
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
    vehicleMakeRepository = module.get(getRepositoryToken(VehicleMake));
    vehicleTypeRepository = module.get(getRepositoryToken(VehicleType));
    xmlParserService = module.get(XmlParserService);

    jest.clearAllMocks();
  });

  describe('getFormattedVehicleData', () => {
    it('should return correctly formatted vehicle data from the repository', async () => {
      const mockDbMakes = [
        Object.assign(new VehicleMake(), {
          id: 1,
          makeId: '440',
          makeName: 'ASTON MARTIN',
          vehicleTypes: [
            Object.assign(new VehicleType(), {
              id: 10,
              typeId: 2,
              typeName: 'Passenger Car',
              makeId: '440',
            }),
          ],
        }),
      ];

      vehicleMakeRepository.find.mockResolvedValue(mockDbMakes);

      const result = await service.getFormattedVehicleData();

      expect(result).toEqual([
        {
          makeId: '440',
          makeName: 'ASTON MARTIN',
          vehicleTypes: [{ typeId: 2, typeName: 'Passenger Car' }],
        },
      ]);
      expect(vehicleMakeRepository.find).toHaveBeenCalledWith({
        relations: ['vehicleTypes'],
      });
    });

    it('should handle errors during repository find', async () => {
      const error = new Error('Database connection error');
      vehicleMakeRepository.find.mockRejectedValue(error);

      await expect(service.getFormattedVehicleData()).rejects.toThrow(error);
    });
  });

  describe('syncData', () => {
    const mockTransformedData = [
      {
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [{ typeId: 2, typeName: 'Passenger Car' }],
      },
      {
        makeId: 441,
        makeName: 'TESLA',
        vehicleTypes: [
          { typeId: 2, typeName: 'Passenger Car' },
          { typeId: 3, typeName: 'MPV' },
        ],
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch, transform, and save data correctly when DB is empty', async () => {
      vehicleMakeRepository.count.mockResolvedValue(0);
      xmlParserService.transformData.mockResolvedValue(mockTransformedData);

      await service.syncData();

      expect(vehicleMakeRepository.count).toHaveBeenCalledTimes(1);
      expect(xmlParserService.transformData).toHaveBeenCalledTimes(1);
      expect(vehicleMakeRepository.save).toHaveBeenCalledTimes(
        mockTransformedData.length,
      );

      const firstSaveCallArg = vehicleMakeRepository.save.mock.calls[0][0];
      expect(firstSaveCallArg).toBeInstanceOf(VehicleMake);
      expect(firstSaveCallArg.makeId).toBe(440);
      expect(firstSaveCallArg.makeName).toBe('ASTON MARTIN');
      expect(firstSaveCallArg.vehicleTypes).toHaveLength(1);

      const secondSaveCallArg = vehicleMakeRepository.save.mock.calls[1][0];
      expect(secondSaveCallArg.makeId).toBe(441);
      expect(secondSaveCallArg.makeName).toBe('TESLA');
      expect(secondSaveCallArg.vehicleTypes).toHaveLength(2);
    });

    it('should handle case where transformData returns empty array', async () => {
      vehicleMakeRepository.count.mockResolvedValue(0);
      xmlParserService.transformData.mockResolvedValue([]);

      await service.syncData();

      expect(vehicleMakeRepository.count).toHaveBeenCalledTimes(1);
      expect(xmlParserService.transformData).toHaveBeenCalledTimes(1);
      expect(vehicleMakeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getFormattedVehicleData', () => {
    it('should return correctly formatted vehicle data from the repository', async () => {
      const mockDbMakes = [
        Object.assign(new VehicleMake(), {
          id: 1,
          makeId: 440,
          makeName: 'ASTON MARTIN',
          vehicleTypes: [
            Object.assign(new VehicleType(), {
              id: 10,
              typeId: 2,
              typeName: 'Passenger Car',
              makeId: 440,
            }),
          ],
        }),
      ];

      vehicleMakeRepository.find.mockResolvedValue(mockDbMakes);

      const result = await service.getFormattedVehicleData();

      expect(result).toEqual([
        {
          makeId: 440,
          makeName: 'ASTON MARTIN',
          vehicleTypes: [{ typeId: 2, typeName: 'Passenger Car' }],
        },
      ]);
      expect(vehicleMakeRepository.find).toHaveBeenCalledWith({
        relations: ['vehicleTypes'],
      });
    });

    it('should handle empty repository', async () => {
      vehicleMakeRepository.find.mockResolvedValue([]);

      const result = await service.getFormattedVehicleData();

      expect(result).toEqual([]);
      expect(vehicleMakeRepository.find).toHaveBeenCalledWith({
        relations: ['vehicleTypes'],
      });
    });

    it('should handle errors during repository find', async () => {
      const error = new Error('Database connection error');
      vehicleMakeRepository.find.mockRejectedValue(error);

      await expect(service.getFormattedVehicleData()).rejects.toThrow(error);
    });
  });
});
