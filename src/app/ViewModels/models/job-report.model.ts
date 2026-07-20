export interface JobReportViewModel {

  srNo: number;

  jobNo: number;

  partyName: string;

  partyMobileNo: string;

  regNo: string;

  mechanicName: string;

  chassisNo: string;

  dealerCode: string;

  serviceLocation: string;

  jobType: string;

  serviceHead: string;

  serviceType: string;

  jobInDate: Date | null;

  estimatedDeliveryDate: Date | null;

  dealerName: string;

  dealerLocation: string;

  city: string;

  state: string;

  kms: number | null;

  motorNo: string;

  batteryNo: string;

  chargerNo: string;

  customerVoice: string;

  customerCode: string;

  observation: string;

  supervisorComment: string;

  jobStatus: string;

  saleDate: Date | string | null;

  supervisorName: string;

  jobCreationSource: string;
}

export interface JobReportPagedResponse {

  data: JobReportViewModel[];

  totalRecords: number;

  pageIndex: number;

  pageSize: number;
}

export interface JobReportFilterModel {

  dealerCode?: string;

  fromDate?: Date;

  toDate?: Date;

  serviceLocation?: string;

  jobNo?: number | null;

  partyName?: string;

  chassisNo?: string;

  regNo?: string;

  pageIndex: number;

  pageSize: number;
}

export interface DealerWiseJobReportSummary {

  dealerCode: string;

  dealerName: string;

  totalJobs: number;

  jobDetails: JobReportViewModel[];
}

export interface JobReportSummaryStats {

  totalJobs: number;

  totalRevenue: number;

  totalTaxes: number;

  completedJobs: number;

  pendingJobs: number;

  averageJobValue: number;
}

export interface DealerDropdownItem {

  dealerCode: string;

  dealerName: string;
}