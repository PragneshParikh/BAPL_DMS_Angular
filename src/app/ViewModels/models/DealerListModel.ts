export interface DealerListModel {
  id: number;
  dealercode: string;
  compname: string;
  email?: string;
  createdDate: string;
  isActive: boolean;
  roleId?: string;
  roleName?: string;
  linkedUserId?: string;
  linkedUserName?: string;
}

export interface DealerListFilter {
  search?: string;
  dealerCode?: string;
  pageIndex: number;
  pageSize: number;
}

export interface DealerListPagedResponse {
  data: DealerListModel[];
  totalRecords: number;
}

export interface DealerQuickUpdate {
  dealercode: string;
  compname: string;
  email?: string;
  isActive: boolean;
}