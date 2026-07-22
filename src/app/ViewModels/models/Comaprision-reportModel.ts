export interface ComparisonReportRow {
  srNo: number;
  vehicleSaleBillId: number;
  dealerCode: string;
  dealerName: string;
  dealerLocation: string;
  city: string;
  state: string;
  customerName: string;
  customerMobile: string;
  chassisNo: string;
  isPerformaCreated: boolean;
  performaCreatedDate: string | Date | null;
  isSaleBillCreated: boolean;
  saleBillCreatedDate: string | Date | null;
}

export interface ComparisonReportFilterModel {
  dealerCode?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  chassisNo?: string | null;
  customerName?: string | null;
  performaCreated?: boolean | null;
  search?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface ComparisonReportPagedResponse {
  data: ComparisonReportRow[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalWithPerforma: number;
  totalSaleBillCreated: number;
}