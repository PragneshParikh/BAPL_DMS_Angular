export interface D2DReportFilter {
  dealerCode?: string | null;
  locationCode?: string | null;
  chassisNo?: string | null;
  motorNo?: string | null;
  batteryNo?: string | null;
  chargerNo?: string | null;
  controllerNo?: string | null;
  stockStatus?: string | null;     // NEW
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface D2DReportRow {
  srNo: number;
  receivingDate: string | null;
  invoiceDate: string | null;
  dealerCode: string | null;
  dealerName: string | null;
  dealerCity: string | null;
  dealerState: string | null;         // NEW - To Dealer State
  fromDealerCode: string | null;      // NEW
  fromDealerName: string | null;      // NEW
  fromDealerCity: string | null;      // NEW
  fromDealerState: string | null;     // NEW
  bgInvoiceNo: string | null;
  locationCode: string | null;
  purchaseReceivingLocation: string | null;
  locationCity: string | null;
  modelCode: string | null;
  modelName: string | null;
  oemModelName: string | null;
  chassisNo: string | null;
  motorNo: string | null;
  colour: string | null;
  mfgYear: number | null;
  batteryNo: string | null;
  batteryMake: string | null;
  batteryCapacity: string | null;
  batteryChemical: string | null;
  chargerNo: string | null;
  controllerNo: string | null;
  stockStatus: string | null;
  isD2D: boolean;
}

export interface D2DReportResponse {
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  data: D2DReportRow[];
}