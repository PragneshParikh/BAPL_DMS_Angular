export interface LocationDetailModel {
  locationId: number;
  locCode?: string;
  locName?: string;
  roleId?: string;
  roleName?: string;
}

export interface UpdateLocationDetail {
  locCode: string;
  locName: string;
  roleId?: string;
}