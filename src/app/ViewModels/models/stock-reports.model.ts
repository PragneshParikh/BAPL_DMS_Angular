export interface ReportDealerOption {
  dealerCode: string;
  dealerName: string;
}

export interface ReportLocationOption {
  loccode: string;
  locname: string;
  dealercode: string;
  locareaidno: number;
  dealerName?: string;
}

export interface PartsStockDetailsReportRow {
  srNo: number;
  itemtype: number;
  itemname: string;
  itemcode: string;
  itemdesc: string;
  hsncode: string;
  dlrprice: number;
  custprice: number;
  gst: number;
  grpidno: number;
  batchClosingQty: number;
  vendorCode: string | null;
  dealerLocation: string;
  dealerName: string | null;
  locname: string;
  groupType: string;
  saleCount: number;
  purchaseCount: number;
  stockAdjustmentQty: number;
  mrp: number;
}

export interface StockAdjustmentReportRow {
  prefixNo: string | null;
  adjustmentDate: string;
  dealerCode: string | null;
  dealerName: string | null;
  locationCode: string | null;
  locationName: string | null;
  partNo: string;
  description: string;
  rateStock: number | null;
  currentStock: number;
  updateStock: number;
  upQuantityStg: number;
  finalQty: number;
  remarks: string | null;
  locareaidno: number | null;
}
