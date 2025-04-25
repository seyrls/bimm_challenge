// /Users/seyrlemos/develop/bimm_challenge/challenge/src/xml-parser/services/xml-parser.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import axios from 'axios';
// import { Parser } from 'xml2js'; // Import Parser for potential prototype mocking if needed
import { XmlParserService } from './xml-parser.service';
import {
  AllVehicleMakes,
  VehicleType,
  //  VehicleMakeType,
} from '../interfaces/vehicle.interface';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

const mockDelay = jest.fn().mockResolvedValue(undefined);

describe('XmlParserService', () => {
  let service: XmlParserService;
  let parserSpy: jest.SpyInstance; // To potentially spy on parseStringPromise

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XmlParserService,
        // Provide the mock logger instance via DI
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<XmlParserService>(XmlParserService);

    // Spy on the parser instance used within the service if needed for specific tests
    // parserSpy = jest.spyOn(service['parser'], 'parseStringPromise'); // Accessing private member for spying
  });

  it('should be defined and log initialization', () => {
    expect(service).toBeDefined();
    expect(mockLogger.log).toHaveBeenCalledWith(
      'XML Parser Service Initialized',
    );
  });

  // --- Tests for getAllMakes ---
  describe('getAllMakes', () => {
    const makesUrl =
      'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=xml';
    const mockXmlResponseMulti = `
      <Response>
        <Results>
          <AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>ASTON MARTIN</Make_Name></AllVehicleMakes>
          <AllVehicleMakes><Make_ID>441</Make_ID><Make_Name>TESLA</Make_Name></AllVehicleMakes>
        </Results>
      </Response>
    `;
    const mockXmlResponseSingle = `
      <Response>
        <Results>
          <AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>ASTON MARTIN</Make_Name></AllVehicleMakes>
        </Results>
      </Response>
    `;
    const mockXmlResponseEmpty = `
      <Response>
        <Results></Results>
      </Response>
    `;
    const expectedMakes = [
      { Make_ID: '440', Make_Name: 'ASTON MARTIN' },
      { Make_ID: '441', Make_Name: 'TESLA' },
    ];

    it('should fetch and parse multiple makes correctly', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockXmlResponseMulti });

      const result = await service.getAllMakes();

      expect(mockedAxios.get).toHaveBeenCalledWith(makesUrl);
      expect(result).toEqual(expectedMakes);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should fetch and parse a single make correctly (handling non-array from parser)', async () => {
      // Simulate parser returning a single object when only one item exists
      const mockParsedSingle = {
        Results: { AllVehicleMakes: expectedMakes[0] },
      };
      const originalParser = service['parser'].parseStringPromise; // Access private member
      service['parser'].parseStringPromise = jest
        .fn()
        .mockResolvedValue(mockParsedSingle);

      mockedAxios.get.mockResolvedValue({ data: mockXmlResponseSingle });

      const result = await service.getAllMakes();

      expect(mockedAxios.get).toHaveBeenCalledWith(makesUrl);
      expect(service['parser'].parseStringPromise).toHaveBeenCalledWith(
        mockXmlResponseSingle,
      );
      expect(result).toEqual([expectedMakes[0]]); // Ensure it's wrapped in an array
      expect(mockLogger.error).not.toHaveBeenCalled();

      // Restore original parser method
      service['parser'].parseStringPromise = originalParser;
    });

    it('should return an empty array if no makes are found', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockXmlResponseEmpty });

      const result = await service.getAllMakes();

      expect(mockedAxios.get).toHaveBeenCalledWith(makesUrl);
      expect(result).toEqual([]);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle Axios network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(service.getAllMakes()).rejects.toThrow('Network Error');
      expect(mockedAxios.get).toHaveBeenCalledWith(makesUrl);
      expect(mockLogger.error).toHaveBeenCalledWith(
        networkError,
        `Error fatching data and parsing Makes XML: Network Error`,
      );
    });

    it('should handle XML parsing errors', async () => {
      const invalidXml = `<Response><Results>Invalid XML</Results>`;
      const parseError = new Error('Invalid XML structure');
      mockedAxios.get.mockResolvedValue({ data: invalidXml });

      const originalParser = service['parser'].parseStringPromise;
      service['parser'].parseStringPromise = jest
        .fn()
        .mockRejectedValue(parseError);

      await expect(service.getAllMakes()).rejects.toThrow(parseError.message);
      expect(mockedAxios.get).toHaveBeenCalledWith(makesUrl);
      expect(service['parser'].parseStringPromise).toHaveBeenCalledWith(
        invalidXml,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        parseError,
        `Error fatching data and parsing Makes XML: ${parseError.message}`,
      );

      service['parser'].parseStringPromise = originalParser;
    });
  });

  describe('getVehicleTypesForMake', () => {
    const makeId = '440';
    const typesUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=xml`;
    const mockXmlResponseMulti = `
      <Response>
        <Results>
          <VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds>
          <VehicleTypesForMakeIds><VehicleTypeId>3</VehicleTypeId><VehicleTypeName>MPV</VehicleTypeName></VehicleTypesForMakeIds>
        </Results>
      </Response>
    `;
    const mockXmlResponseSingle = `
      <Response>
        <Results>
          <VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds>
        </Results>
      </Response>
    `;
    const mockXmlResponseEmpty = `
      <Response>
        <Results></Results>
      </Response>
    `;
    const expectedTypes = [
      { VehicleTypeId: '2', VehicleTypeName: 'Passenger Car' },
      { VehicleTypeId: '3', VehicleTypeName: 'MPV' },
    ];

    it('should fetch and parse multiple vehicle types correctly', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockXmlResponseMulti });

      const result = await service.getVehicleTypesForMake(makeId);

      expect(mockedAxios.get).toHaveBeenCalledWith(typesUrl);
      expect(result).toEqual(expectedTypes);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should fetch and parse a single vehicle type correctly (handling non-array)', async () => {
      const mockParsedSingle = {
        Results: { VehicleTypesForMakeIds: expectedTypes[0] },
      };
      const originalParser = service['parser'].parseStringPromise;
      service['parser'].parseStringPromise = jest
        .fn()
        .mockResolvedValue(mockParsedSingle);

      mockedAxios.get.mockResolvedValue({ data: mockXmlResponseSingle });

      const result = await service.getVehicleTypesForMake(makeId);

      expect(mockedAxios.get).toHaveBeenCalledWith(typesUrl);
      expect(service['parser'].parseStringPromise).toHaveBeenCalledWith(
        mockXmlResponseSingle,
      );
      expect(result).toEqual([expectedTypes[0]]);
      expect(mockLogger.error).not.toHaveBeenCalled();

      service['parser'].parseStringPromise = originalParser;
    });

    it('should return an empty array if no types are found', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockXmlResponseEmpty });

      const result = await service.getVehicleTypesForMake(makeId);

      expect(mockedAxios.get).toHaveBeenCalledWith(typesUrl);
      expect(result).toEqual([]);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle Axios network errors', async () => {
      const networkError = new Error('Connection Refused');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(service.getVehicleTypesForMake(makeId)).rejects.toThrow(
        'Connection Refused',
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(typesUrl);
      expect(mockLogger.error).toHaveBeenCalledWith(
        networkError,
        `Error fatching data and parsing Vehicle Types XML: Connection Refused`,
      );
    });

    it('should handle XML parsing errors', async () => {
      const invalidXml = `<Response><Results>Bad XML</Results>`;
      const parseError = new Error('Bad XML structure');
      mockedAxios.get.mockResolvedValue({ data: invalidXml });
      const originalParser = service['parser'].parseStringPromise;
      service['parser'].parseStringPromise = jest
        .fn()
        .mockRejectedValue(parseError);

      await expect(service.getVehicleTypesForMake(makeId)).rejects.toThrow(
        parseError.message,
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(typesUrl);
      expect(service['parser'].parseStringPromise).toHaveBeenCalledWith(
        invalidXml,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        parseError,
        `Error fatching data and parsing Vehicle Types XML: ${parseError.message}`,
      );

      service['parser'].parseStringPromise = originalParser;
    });
  });

  describe('transformData', () => {
    const mockMakes: AllVehicleMakes[] = [
      { Make_ID: 440, Make_Name: 'MAKE_A' },
      { Make_ID: 441, Make_Name: 'MAKE_B' },
      { Make_ID: 442, Make_Name: 'MAKE_C' },
    ];
    const mockTypesA: VehicleType[] = [
      {
        VehicleTypeId: 1,
        VehicleTypeName: 'Type A1',
        MakeId: 440,
        MakeName: 'MAKE_A',
      },
    ];
    const mockTypesB: VehicleType[] = [
      {
        VehicleTypeId: 2,
        VehicleTypeName: 'Type B1',
        MakeId: 441,
        MakeName: 'MAKE_B',
      },
    ];
    const mockTypesC: VehicleType[] = [
      {
        VehicleTypeId: 4,
        VehicleTypeName: 'Type C1',
        MakeId: 442,
        MakeName: 'MAKE_C',
      },
    ];

    const BATCH_SIZE = 10; // From service code
    const DELAY_MS = 3000; // From service code

    let getAllMakesSpy: jest.SpyInstance;
    let getVehicleTypesForMakeSpy: jest.SpyInstance;

    beforeEach(() => {
      getAllMakesSpy = jest.spyOn(service, 'getAllMakes');
      getVehicleTypesForMakeSpy = jest.spyOn(service, 'getVehicleTypesForMake');
      mockDelay.mockClear();
    });

    it('should fetch makes, types (in batches), and transform data correctly', async () => {
      // Arrange Mocks
      getAllMakesSpy.mockResolvedValue(mockMakes);
      getVehicleTypesForMakeSpy
        .mockResolvedValueOnce(mockTypesA) // For Make A (ID 440)
        .mockResolvedValueOnce(mockTypesB) // For Make B (ID 441)
        .mockResolvedValueOnce(mockTypesC); // For Make C (ID 442)

      // Act
      const result = await service.transformData();

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Starting data transformation...',
      );
      expect(getAllMakesSpy).toHaveBeenCalledTimes(1);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Processing batch # 1 (Makes 1 to 3)...',
      );
      expect(getVehicleTypesForMakeSpy).toHaveBeenCalledTimes(mockMakes.length);
      expect(getVehicleTypesForMakeSpy).toHaveBeenCalledWith('440');
      expect(getVehicleTypesForMakeSpy).toHaveBeenCalledWith('441');
      expect(getVehicleTypesForMakeSpy).toHaveBeenCalledWith('442');

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Batch 1 completed. Processed total of 3/3 makes.',
      );

      expect(mockDelay).not.toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Waiting for'),
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Fetched all the vehicle types.',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Parsed and transformed data',
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        makeId: 440,
        makeName: 'MAKE_A',
        vehicleTypes: [{ typeId: 1, typeName: 'Type A1' }],
      });
      expect(result[1]).toEqual({
        makeId: 441,
        makeName: 'MAKE_B',
        vehicleTypes: [{ typeId: 2, typeName: 'Type B1' }],
      });
      expect(result[2]).toEqual({
        makeId: 442,
        makeName: 'MAKE_C',
        vehicleTypes: [{ typeId: 4, typeName: 'Type C1' }],
      });

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching types for a specific make and continue', async () => {
      // Arrange
      const typeFetchError = new Error('Failed to fetch types for MAKE_B');
      getAllMakesSpy.mockResolvedValue(mockMakes);
      getVehicleTypesForMakeSpy
        .mockResolvedValueOnce(mockTypesA) // Make A - OK
        .mockRejectedValueOnce(typeFetchError) // Make B - Error
        .mockResolvedValueOnce(mockTypesC); // Make C - OK

      // Act
      const result = await service.transformData();

      // Assert
      expect(getAllMakesSpy).toHaveBeenCalledTimes(1);
      expect(getVehicleTypesForMakeSpy).toHaveBeenCalledTimes(mockMakes.length);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to fetch types for make MAKE_B and ID: 441. Error: ${typeFetchError.message}`,
      );

      expect(result).toHaveLength(3);
      expect(result[0].makeName).toBe('MAKE_A');
      expect(result[0].vehicleTypes).toEqual([
        { typeId: 1, typeName: 'Type A1' },
      ]);
      expect(result[1].makeName).toBe('MAKE_B');
      expect(result[1].vehicleTypes).toEqual([]);
      expect(result[2].makeName).toBe('MAKE_C');
      expect(result[2].vehicleTypes).toEqual([
        { typeId: 4, typeName: 'Type C1' },
      ]);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Fetched all the vehicle types.',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Parsed and transformed data',
      );
    });

    it('should return empty array if getAllMakes returns empty', async () => {
      // Arrange
      getAllMakesSpy.mockResolvedValue([]);

      // Act
      const result = await service.transformData();

      // Assert
      expect(getAllMakesSpy).toHaveBeenCalledTimes(1);
      expect(getVehicleTypesForMakeSpy).not.toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Starting data transformation...',
      );
      expect(mockLogger.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Processing batch #'),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Fetched all the vehicle types.',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Parsed and transformed data',
      );
    });

    it('should throw error and log if getAllMakes fails', async () => {
      // Arrange
      const makesError = new Error('Failed to get makes');
      getAllMakesSpy.mockRejectedValue(makesError);

      // Act & Assert
      await expect(service.transformData()).rejects.toThrow(makesError);

      expect(getAllMakesSpy).toHaveBeenCalledTimes(1);
      expect(getVehicleTypesForMakeSpy).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        makesError,
        `Failed to transform data: ${makesError.message}`,
      );
    });
  });
});
