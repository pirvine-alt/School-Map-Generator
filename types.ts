export enum SchoolStatus {
  Defined = 'Defined',
  Pending = 'Pending',
  NoService = 'No Service',
}

export interface School {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: SchoolStatus;
  administrativeDesignation: string;
  district: string;
}