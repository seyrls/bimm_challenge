
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface VehicleType {
    typeId: number;
    typeName: string;
}

export interface VehicleMake {
    makeId: number;
    makeName: string;
    vehicleTypes: VehicleType[];
}

export interface IQuery {
    vehicleMakes(): VehicleMake[] | Promise<VehicleMake[]>;
}

type Nullable<T> = T | null;
