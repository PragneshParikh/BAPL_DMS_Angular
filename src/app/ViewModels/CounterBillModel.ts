export interface CounterBillPrintDetail {
  partCode: string;
  partName: string;
  saleType: string;
  qty: number;
  rate: number;
  discType: string;
  discount: number;
  mrp: number;
  igstper: number;
  igstamnt: number;
  cgstper: number;
  cgstamnt: number;
  sgstper: number;
  sgstamnt: number;
  hsnCode:string;
}

export interface CounterBillPrintModel {
  dealerCode: string;
  dealerName: string;
  dealerAddress1: string;
  dealerAddress2: string;
  pin: string;
  phoneNo1: string;
  phoneNo2: string;
  panNo: string;
  gstNo: string;
  billType:string;
  invoiceNo: string;
  invoiceDate: Date;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  state: string;
  city:string;
  remarks:string;
  customerGST: string;
  details: CounterBillPrintDetail[];
    termsAndConditions?: SalesConditionViewModel[];

}
export interface SalesConditionViewModel {
  id: number;
  srNo?: number;
  conditionText?: string;
}