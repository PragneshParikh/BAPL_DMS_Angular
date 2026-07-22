export interface VehicleInwardReportViewModel {
  srNo: number;

  // NOTE: VehicleInward has only one date column on the backend —
  // receivingDate and invoiceDate will always be identical values.
  receivingDate: string | Date | null;
  invoiceDate: string | Date | null;

  dealerCode: string;
  dealerName: string;
  bgInvoiceNo: string;
  lotInspectionNo: number | null;

  // NOTE: no PartyName column exists on VehicleInward on the backend —
  // this will always render blank. Kept for structural completeness with
  // the backend ViewModel.
  partyName: string;

  purchaseReceivingLocation: string;
  modelName: string;
  quantity: number;
  chassisNo: string;
  motorNo: string;
  colour: string;
  mfgYear: number | null;
  batteryNo: string;
  batteryMake: string;
  batteryCapacity: string;
  batteryChemical: string;
  chargerNo: string;
  controllerNo: string;
  rate: number;
  subsidyAmountFame2: number;
  sgst: number;
  cgst: number;
  igst: number;
  hst: number;
}

export interface VehicleInwardReportFilterModel {
  dealerCode?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  locationCode?: string | null;
  invoiceNo?: string | null;
  chassisNo?: string | null;
  motorNo?: string | null;
  batteryNo?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface VehicleInwardReportResponse {
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalQuantity: number;
  totalRate: number;
  totalSubsidy: number;
  totalSgst: number;
  totalCgst: number;
  totalIgst: number;
  totalHst: number;
  grandTotal: number;
  data: VehicleInwardReportViewModel[];
}