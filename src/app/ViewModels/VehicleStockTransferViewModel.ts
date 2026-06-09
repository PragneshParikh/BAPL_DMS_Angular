export interface VehicleStockTransferFilter {
  fromDate?: string;
  toDate?: string;
  issuingLocation?: string;
  receivingLocation?: string;
  dealerCode?: string;
  search?: string;
}