export interface CampusPlaceProps {
  id?: string;
  buildingId: string;
  name: string;
  floor: string;
  maxPhysicalCapacity: number;
  isActive: boolean;
}

export class CampusPlace {
  readonly id?: string;
  readonly buildingId: string;
  readonly name: string;
  readonly floor: string;
  readonly maxPhysicalCapacity: number;
  readonly isActive: boolean;

  constructor(props: CampusPlaceProps) {
    this.id = props.id;
    this.buildingId = props.buildingId;
    this.name = props.name;
    this.floor = props.floor;
    this.maxPhysicalCapacity = props.maxPhysicalCapacity;
    this.isActive = props.isActive;
  }
}

export const CAMPUS_SERVICE_TYPES = [
  'RESTAURANTE',
  'CAFETERIA',
  'BIBLIOTECA',
  'ENFERMERIA',
  'FOTOCOPIAS',
  'PARQUEADERO',
  'OFICINA',
] as const;

export type CampusServiceType = (typeof CAMPUS_SERVICE_TYPES)[number];

export interface CampusServiceProps {
  id?: string;
  name: string;
  serviceType: CampusServiceType;
  operatingHours: string | null;
  phone: string | null;
  buildingId: string;
}

export class CampusService {
  readonly id?: string;
  readonly name: string;
  readonly serviceType: CampusServiceType;
  readonly operatingHours: string | null;
  readonly phone: string | null;
  readonly buildingId: string;

  constructor(props: CampusServiceProps) {
    this.id = props.id;
    this.name = props.name;
    this.serviceType = props.serviceType;
    this.operatingHours = props.operatingHours;
    this.phone = props.phone;
    this.buildingId = props.buildingId;
  }
}

export interface BuildingProps {
  id?: string;
  code: string;
  name: string;
  description: string | null;
  svgElementId: string;
  imageUrl: string | null;
  floorsCount: number;
  academicInfo: string | null;
  isActive: boolean;
  places?: CampusPlace[];
  services?: CampusService[];
}

export class Building {
  readonly id?: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly svgElementId: string;
  readonly imageUrl: string | null;
  readonly floorsCount: number;
  readonly academicInfo: string | null;
  readonly isActive: boolean;
  readonly places: CampusPlace[];
  readonly services: CampusService[];

  constructor(props: BuildingProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this.description = props.description;
    this.svgElementId = props.svgElementId;
    this.imageUrl = props.imageUrl;
    this.floorsCount = props.floorsCount;
    this.academicInfo = props.academicInfo;
    this.isActive = props.isActive;
    this.places = props.places ? [...props.places] : [];
    this.services = props.services ? [...props.services] : [];
  }
}
