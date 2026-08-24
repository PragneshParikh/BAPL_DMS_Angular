export interface DealerMenuAccessItem {
  subMenuId: number;
  menuName: string;
  pathName?: string;
  isGranted: boolean;
  moduleName?: string;
}

export interface DealerMenuAccessGroup {
  topMenuId: number;
  topMenuName: string;
  items: DealerMenuAccessItem[];
}

export interface DealerMenuAccessResponse {
  dealerId: number;
  roleId?: string;
  roleName?: string;
  groups: DealerMenuAccessGroup[];
}

export interface DealerLocationModel {
  id: number;
  locCode?: string;
  locName?: string;
  isActive: boolean;
}
