export interface VehicleSaleReportViewModel {

  srNo: number;

  modelCode: string;

  modelDescription: string;

  oemModelName: string;

  vehicleGroup: string;

  colorCode: string;

  chasisNo: string;

  billingName?: string;

  hsn?: string;

  mfgYear?: number;

  regNo: string;

  dealerCode: string;

  dealerName: string;

  dealerCity: string;

  dealerState: string;

  location: string;

  locCode: string;

  locCity: string;

  name: string;

  address1: string;

  address2: string;

  customerState: string;

  customerCity: string;

  pin: string;

  email: string;

  mobileNo: string;

  type: string;

  bookingId: string;

  dispatchDate: Date | string;

  saleDate: Date | string;

  invoiceNo: string;

  saleBillNo?: string;

  billType: string;

  saleType?: string;

  status: string;

  financeBy: string;

  financierId?: number;

  financerCode: string;

  financerCategory: string;

  executiveName: string;

  prospectName: string;

  prospectMobNo: string;

  motorNumber: string;

  batteryNo: string;

  batteryNo2: string;

  batteryNo3: string;

  batteryNo4: string;

  batteryNo5: string;

  batteryNo6: string;

  batteryCapacity: string;

  chargerNo?: string;

  controllerNo?: string;

  itemRate?: number;

  preGstDiscount?: number;

  taxableAmount?: number;

  sgstPer?: number;

  sgstAmount?: number;

  cgstPer?: number;

  cgstAmount?: number;

  igstPer?: number;

  igstAmount?: number;

  totalGstAmount?: number;

  finalAmount?: number;

  subsidyAmount: number;

  fameIIRequired: boolean;

  totalAmount: number;

  billDate: Date | string;
}

export interface DealerDropdownItem {

  dealerCode: string;

  dealerName: string;
}