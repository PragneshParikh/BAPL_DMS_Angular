export interface JobReportViewModel {

  srNo: number;

  invoiceNo: number;

  invoiceDate: Date | string;

  jobNo: number;

  partyName: string;

  partyMobileNo: string;

  regNo: string;

  mechanicName: string;

  invoiceType: string;

  invoiceMode: string;

  sparesAmount: number;

  acsrAmount: number;

  oilAmount: number;

  labourAmount: number;

  outsideWorkAmount: number;

  taxableAmount: number;

  sgstAmount: number;

  cgstAmount: number;

  chassisNo: string;

  dealerCode: string;

  serviceLocation: string;

  jobType: string;

  serviceHead: string;

  serviceType: string;

  jobInDate: Date | null;

  estimatedDeliveryDate: Date | null;
}

export interface JobReportPagedResponse {

  data: JobReportViewModel[];

  totalRecords: number;

  pageIndex: number;

  pageSize: number;

  totalSpares: number;

  totalAcsr: number;

  totalOil: number;

  totalLabour: number;

  totalOutsideWork: number;

  totalTaxable: number;

  totalSGST: number;

  totalCGST: number;

  grandTotal: number;
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

  totalSpares: number;

  totalLabour: number;

  totalTaxable: number;

  totalSGST: number;

  totalCGST: number;

  grandTotal: number;

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