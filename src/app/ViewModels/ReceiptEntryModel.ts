export interface ReceiptEntryModel {
  id: number;
dealerCode?:string;
  location?: string;

  receiptNo: string;

  receiptDate: string;

  saleType?: string;

  bookingId?: string;
  mobileNo?: string;
  email?: string;

  partyName?: string;

  financier?: string;
  businessType?: string;

  productCode: string;
  productName?: string;
  productColor?: string;
  productDescription?: string;

  salesExecutive?: string;

  receiptType?: string;

  refNo?: string;

  narration?: string;

  totalAmount?: number;

  createdBy: string;

  createdDate?: string;

  updatedBy?: string;

  updatedDate?: string;
}

export interface LocationName {
  locareadidNo: number;
  locname: string;
  locCode:string;
}

export interface ReceiptFilter {
  fromDate?: string;
  toDate?: string;
  receiptNo?: string;
  partyName?: string;
  mobileNo?: string;
  bookingId?: string;
  location?: string;
  saleType?: string;
  dealerCode?:string;
}

export interface ReceiptEntryAddViewModel {
  location?: string;
  receiptNo: string;
  saleType?: string;
  bookingId?: string;
  partyName?: string;
  financier?: string;
  productCode: string;
  salesExecutive?: string;
  businessType?: string;

  receiptType?: string;
  mobileNo?: string;
  billDate?: string;
  billNo?: string;
  refNo?: string;
  narration?: string;
  totalAmount?: number;
  dealerCode?:string;
  receiptEntryDetail:ReceiptDetail[];
}

export interface ReceiptEntryEditModel {
  id: number;
  location?: string;
  receiptNo: string;
  mobileNo?: string;
  receiptDate: string;
  saleType?: string;
  bookingId?: string;
  partyName?: string;
  financier?: string;
  productCode: string;
  productName?: string;
  productColor?: string;
  productDescription?: string;
  businessType?: string;
  salesExecutive?: string;
 // receiptType?: string;
  refNo?: string;
  narration?: string;
  totalAmount?: number;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
  receiptEntryDetail: ReceiptDetail[];
}
export interface ReceiptDetail {
  lineItemNo: number;
  amount: number;
  receiptType: string;
  lineDate:string;
}
