export interface POTrackingReportViewModel {

  srNo: number;

  dealerName?: string;

  dealerCode?: string;

  locationName?: string;

  orderNumber?: string;

  orderDate?: Date | string;

  submitToERPDate?: Date | string;

  poType?: string;

  poQty: number;

  billedQty: number;

  pendingQty: number;

  archived: number;

  poPrice: number;

  billedPrice: number;

  pendingPOPrice: number;

  archivedPriceExclGST: number;

  poStatus?: string;

  uniqueId?: string;

  dealerPONo?: string;

  walletDebit: number;

  pgDebit: number;

  pgStatus?: string;

  paymentLink?: string;

  paymentType?: string;

  tempPONo?: string;

  merchantOrderNo?: string;

  merchantOrderStatus?: string;
}

export interface POTrackingFilterModel {

  dealerCode?: string;

  fromDate?: Date;

  toDate?: Date;

  poType?: string;

  poStatus?: string;

  pageIndex: number;

  pageSize: number;
}

export interface PagedResponse<T> {

  data: T[];

  totalRecords: number;
}

export interface DropdownItem {

  value: string;

  text: string;
}

export interface DealerDropdownItem {

  dealerCode: string;

  dealerName: string;
}