export interface RepairBillReportRow {
  srNo: number;

  repairBillDetailId: number;
  repairBillId: number;

  dealerCode: string;
  dealerName: string;
  dealerLocation: string;
  city: string;
  state: string;

  jobDate: string | Date | null;
  jobType: string;
  jobNo: number | null;  
  serviceHead: string;
  serviceType: string;

  customerName: string;
  customerMobile: string;
  chassisNo: string;
  modelDetails: string;

  jobStatus: string;

  repairBillNo: string;
  repairBillDate: string | Date | null;

  partCode: string;
  partCodeDescription: string;

  issueType: number | null;

  itemRate: number;
  labourRateRaw: number;  
  totalLabourRate: number; 
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  totalGstAmount: number;

  discount: number;
  discountType: string;

  labourCode: string;
  labourDescription: string;

  technicianName: string;

  itemType: string;
}

export interface RepairBillReportFilterModel {
  dealerCode?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  billNo?: number | null;
  jobNo?: number | null;
  chassisNo?: string | null;
  partyName?: string | null;
  partCode?: string | null;
  labourCode?: string | null;
  jobStatus?: string | null;
  search?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface RepairBillReportPagedResponse {
  data: RepairBillReportRow[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalItemRate: number;
  totalLabourRate: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalGstAmount: number;
  totalDiscount: number;
}