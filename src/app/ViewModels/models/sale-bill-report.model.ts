export interface VehicleSaleBillReportViewModel {
  // Col 1–17 — identity / party / item
  srNo: number;
  billNo: string | null;
  billDate: string;                // ISO date string from DateTime
  bookingId: string | null;
  partyName: string | null;
  contactPerson: string | null;
  partyAddress: string | null;
  location: string | null;
  partyMobile: string | null;
  partyEmail: string | null;
  executiveName: string | null;
  gstnNo: string | null;
  itemModel: string | null;
  description: string | null;
  oemModelName: string | null;
  hsnSacCode: string | null;
  salesType: string | null;

  // Col 18–28 — charges / discounts
  itemRate: number;
  insuAmnt: number;
  regnAmnt: number;
  acsryAmnt: number;
  finAmnt: number;
  processingFee: number;
  hypAmnt: number;
  otherCharge: number;
  smartCardAmnt: number;
  postGstDiscAmnt: number;
  preGstDiscAmnt: number;

  // Col 29–34 — taxes
  sgstper: number;
  sgstamnt: number;
  cgstper: number;
  cgstamnt: number;
  igstper: number;
  igstamnt: number;

  // Col 35–39 — subsidy / totals
  subsidyAmnt: number;
  stateSubsidyAmnt: number;
  numPlateAmnt: number;
  handlingCharges: number;
  netAmnt: number;

  // Col 40–43 — vehicle / financier
  regNo: string | null;
  chasisNo: string | null;
  color: string | null;
  financerName: string | null;

  // Internal / dealer restriction
  dealerCode: string | null;
  status: string | null;
  invoiceNo: string | null;
}


export interface VehicleSaleBillReportFilterModel {
  pageIndex: number;
  pageSize: number;
  dealerCode?: string | null;
  /** ISO yyyy-MM-dd or Date — backend compares on .Date only. */
  fromDate?: string | Date | null;
  toDate?: string | Date | null;
  /** Matches: BillNo, PartyName, BillingName, ChasisNo, RegNo, ModelName. */
  search?: string | null;
  saleType?: string | null;
  status?: string | null;
  itemCode?: string | null;
  location?: string | null;
}


export interface VehicleSaleBillReportPagedResponse {
  success: boolean;
  pageIndex: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  totalVehicles: number;
  totalSaleAmount: number;
  totalGstAmount: number;
  totalSubsidyAmount: number;
  totalNetAmount: number;
  data: VehicleSaleBillReportViewModel[];
}