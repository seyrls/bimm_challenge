export interface AllVehicleMakes {
  Make_ID: number;
  Make_Name: string;
}

export interface VehicleType {
  VehicleTypeId: number;
  VehicleTypeName: string;
  MakeId: number;
  MakeName: string;
}

export interface VehicleMakeType {
  makeId: number;
  makeName: string;
  vehicleTypes: {
    typeId: number;
    typeName: string;
  }[];
}
