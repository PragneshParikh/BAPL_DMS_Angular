export interface MaterialTransferReportRow {
  srNo: number;

  dealerCode: string;
  dealerName: string;
  dealerCity: string;
  dealerState: string;

  jobId: number;
  jobNo: number | null;
  jobInvoiceNo: string;
  chassisNo: string;
  registerNo: string;
  customerName: string;
  customerMobile: string;
  serviceLocationCode: string;
  serviceLocationName: string;

  materialPrefix: string;
  materialIssueNumber: number;
  transferDate: string | Date;

  itemCode: string;
  itemName: string;
  itemDesc: string;
  hsncode: string;

  quantity: number;
  itemRate: number;
  amount: number;

  serialNo: string;
  remarks: string;
  itemReceived: string;
  validDays: number | null;
  rackNo: number | null;
  bin: number | null;

  technicianId: number;
  issueType: number;

  jobCardStatus: string;

  preparedByDealerCode: string;
  modifiedByDealerCode: string;
}

export interface MaterialTransferReportFilterModel {
  dealerCode?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  jobNo?: number | null;
  chassisNo?: string | null;
  partyName?: string | null;
  itemCode?: string | null;
  search?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface MaterialTransferReportPagedResponse {
  data: MaterialTransferReportRow[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalQuantity: number;
  totalAmount: number;
}