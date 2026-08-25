export interface WarrantyRegisterViewModel {
  id: number;
  srNo?: string;
  claimType?: string;
  jobNo?: string;
  jobDate?: string;
  rbillNo?: string;
  rbillDate?: string;
  itemName?: string;
  description?: string;
  partName?: string;
  partDescription?: string;
  labourName?: string;
  labourDescription?: string;
  modelName?: string;
  modelDescription?: string;
  qty?: number;
  rate?: number;
  mrp?: number;
  taxableAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  totalGstAmount?: number;
  totalAmount?: number;
  warrantyClaimNo?: string;
  warrantyClaimDate?: string;
  chasisNo?: string;
  partyName?: string;
  warrantyClaimStatus?: string;
  approverEngineerName?: string;
  claimAcceptRejectReason?: string;
  prnNo?: string;
  warrantyOrderStatus?: string;
  warrantyOrderNo?: string;
  warrantyOrderDate?: string;
  warrantyInvoiceStatus?: string;
  warrantyInvoiceNo?: string;
  warrantyInvoiceDate?: string;
  packingSlipNo?: string;
  packingSlipDate?: string;
  dispatchNo?: string;
  dispatchDate?: string;
  dispatchReceivedStatus?: string;
  dispatchReceivedDate?: string;
  dispatchReceivedRemarks?: string;
  verificationDate?: string;
  packingConcern?: string;
  packingConcernType?: string;
  packingConcernRemarks?: string;
  materialConcern?: string;
  materialConcernType?: string;
  materialConcernRemarks?: string;
}
 
export interface WarrantyRegisterFilterModel {
  dealerCode?: string | null;
  locationCode?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  chassisNo?: string | null;
  claimNo?: number | null;
  jobNo?: string | null;
  warrantyClaimStatus?: string | null;
  warrantyOrderStatus?: string | null;
  warrantyInvoiceStatus?: string | null;
  search?: string | null;
  pageIndex: number;
  pageSize: number;
}
 
export interface WarrantyRegisterPagedResponse {
  data: WarrantyRegisterViewModel[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
}
 

export interface DealerDropdownItemLite {
  dealerCode: string;
  dealerName: string;
}