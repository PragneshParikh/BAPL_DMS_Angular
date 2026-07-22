export interface MaterialTransferReportRow {
  srNo: number;

  dealerCode: string;
  dealerName: string;

  // NEW — replaces serviceLocationCode/serviceLocationName, shown right
  // after Dealer Code/Name.
  dealerLocation: string;

  dealerCity: string;
  dealerState: string;

  jobId: number;
  jobNo: number | null;
  chassisNo: string;
  customerName: string;
  customerMobile: string;

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

  // NEW — sourced from ItemMaster.Custprice, per instruction
  mrp: number;

  // NEW — GST calculation, sourced from ItemMaster rate fields
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  totalGstAmount: number;

  serialNo: string;
  remarks: string;

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
  totalMrp: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalGstAmount: number;
}