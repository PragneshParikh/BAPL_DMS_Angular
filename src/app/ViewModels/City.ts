export interface City {
  cityId: number;
  cityName: string;
  stateId: number;
  createdBy: string;
  createddate: string; 
  updatedBy?: string | null;
  updateddate?: string | null;

  isMetro?: boolean | null;
  tierLevel?: number | null;
  abbreviation?: string | null;
  isActive?: boolean | null;

//   ledgerMasters: any[]; // you can strongly type later
//   state?: State | null;
}

export interface CityTableModel {
  id: number;
  countryname: string;
  statename: string;
  cityname: string;
  abbreviation?: string;
  active: boolean;
}

export interface CityModel {
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
}