export interface VehicleSaleBillReportFilterModel {
  dealerCode?: string;
  fromDate?: string;
  toDate?: string;
  saleType?: string;
  customerType?: string;
  billType?: number;
  status?: string;
  chassisNo?: string;
  saleBillNo?: string;
  search?: string;
  pageIndex: number;
  pageSize: number;
}

export interface VehicleSaleBillReportViewModel {
  srNo: number;
  saleBillId: number;
  saleBillNo?: string;
  saleDate: string;
  status?: string;
  location?: string;
  dealerCode?: string;
  dealerName?: string;
  customerName?: string;
  billingName?: string;
  customerType?: string;
  saleType?: string;
  billType?: number;
  financier?: string;
  salesExecutive?: string;
  customerMobile?: string;
  customerCity?: string;
  customerState?: string;
  invoiceNo?: string;
  chassisNo?: string;
  motorNo?: string;
  itemCode?: string;
  modelName?: string;
  oemModelName?: string;
  colour?: string;
  hsn?: string;
  mfgYear?: number;
  regNo?: string;
  insNo?: string;
  itemRate: number;
  preGstDiscount: number;
  taxableAmount: number;
  sgstPer: number;
  sgstAmount: number;
  cgstPer: number;
  cgstAmount: number;
  igstPer: number;
  igstAmount: number;
  fameIIDiscount: number;
  regAmount: number;
  insuranceAmount: number;
  postGstDiscount: number;
  finalAmount: number;
  battery?: string;
  chargerNo?: string;
  controllerNo?: string;
  vcu?: string;
  dealerCity?: string;
  dealerState?: string;
  address1?: string;

  batteryNo?: string;
  batteryNo2?: string;
  batteryNo3?: string;

  batteryCapacity?: string;

  subsidyAmount?: number;
  fameIIRequired?: boolean;
}

export interface VehicleSaleBillReportResponse {
  data: VehicleSaleBillReportViewModel[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalItemRate: number;
  totalTaxable: number;
  totalSgst: number;
  totalCgst: number;
  totalIgst: number;
  totalFameII: number;
  totalRegistration: number;
  totalInsurance: number;
  grandTotal: number;
}