export interface VehicleSaleReportViewModel {

  srNo: number;

  modelCode: string;

  modelDescription: string;

  oemModelName: string;

  vehicleGroup: string;

  colorCode: string;

  chasisNo: string;

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

  billType: string;

  financeBy: string;

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

  subsidyAmount: number;

  fameIIRequired: boolean;

  totalAmount: number;

  billDate: Date | string;
}

export interface DealerDropdownItem {

  dealerCode: string;

  dealerName: string;
}