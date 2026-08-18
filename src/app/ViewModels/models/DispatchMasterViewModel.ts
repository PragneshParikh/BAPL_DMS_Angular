export interface DispatchMasterViewModel {
  id: number;
  masterType: string;
  masterName: string;
  isActive: boolean;
  updatedBy?: string;
}

export interface DispatchMasterListViewModel {
  srNo: number;
  id: number;
  masterType: string;
  masterName: string;
  isActive: boolean;
}

export interface DispatchMasterApiResponse {
  success: boolean;
  totalRecords: number;
  data: DispatchMasterListViewModel[];
}