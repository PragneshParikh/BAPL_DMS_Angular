export interface VehicleStockFilterModel {

  dealerCode?: string;

  modelCode?: string;

  colorCode?: string;

  chassisNo?: string;

  stockStatus?: string;

  isBilled?: boolean;

  fromDate?: Date;

  toDate?: Date;

  pageIndex: number;

  pageSize: number;
}

export interface VehicleStockReportViewModel {

  srNo: number;

  dealerCode?: string;

  dealerName?: string;

  modelCode?: string;

  modelName?: string;

  oemModelName?: string;

  colorName?: string;

  chassisNo?: string;

  motorNo?: string;

  batteryNo?: string;

  invoiceNo?: string;

  dispatchDate?: Date;

  receiveDate?: Date;

  stockStatus?: string;

  vehicleStatus?: string;

  location?: string;

  daysInStock: number;
}

export interface PagedResponse<T> {

  data: T[];

  totalRecords: number;
}