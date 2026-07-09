export interface DealerDropdownItem {
  dealerCode: string;
  dealerName: string;
}

export interface UnifiedSaleReportViewModel {
  // ── Identity ──────────────────────────────────────────────
  srNo:            number;
  source:          'SaleBill' | 'VehicleSale';   // which API the row came from
  saleBillId?:     number;
  saleBillNo?:     string;
  invoiceNo?:      string;
  saleDate?:       string | Date;
  billDate?:       string | Date;
  status?:         string;
  bookingId?:      string;

  // ── Dealer ────────────────────────────────────────────────
  dealerCode?:     string;
  dealerName?:     string;
  dealerCity?:     string;
  dealerState?:    string;
  location?:       string;
  locCode?:        string;
  locCity?:        string;

  // ── Customer ──────────────────────────────────────────────
  customerName?:   string;
  billingName?:    string;
  customerType?:   string;
  customerMobile?: string;
  customerCity?:   string;
  customerState?:  string;
  address1?:       string;
  address2?:       string;
  email?:          string;
  pin?:            string;

  // ── Sale info ─────────────────────────────────────────────
  saleType?:       string;
  billType?:       number | string;
  financier?:      string;
  financeBy?:      string;
  financierId?:    number;
  financerCode?:   string;
  financerCategory?: string;
  salesExecutive?: string;
  executiveName?:  string;
  prospectName?:   string;
  prospectMobNo?:  string;

  // ── Vehicle ───────────────────────────────────────────────
  chassisNo?:      string;
  chasisNo?:       string;
  motorNo?:        string;
  motorNumber?:    string;
  itemCode?:       string;
  modelCode?:      string;
  modelName?:      string;
  modelDescription?: string;
  oemModelName?:   string;
  colour?:         string;
  colorCode?:      string;
  hsn?:            string;
  mfgYear?:        number;
  regNo?:          string;
  insNo?:          string;
  vehicleGroup?:   string;
  dispatchDate?:   string | Date;

  // ── Battery / components ──────────────────────────────────
  batteryNo?:      string;
  batteryNo2?:     string;
  batteryNo3?:     string;
  batteryNo4?:     string;
  batteryNo5?:     string;
  batteryNo6?:     string;
  batteryCapacity?: string;
  battery?:        string;
  chargerNo?:      string;
  controllerNo?:   string;
  vcu?:            string;

  // ── Financial ─────────────────────────────────────────────
  itemRate?:       number;
  preGstDiscount?: number;
  taxableAmount?:  number;
  sgstPer?:        number;
  sgstAmount?:     number;
  cgstPer?:        number;
  cgstAmount?:     number;
  igstPer?:        number;
  igstAmount?:     number;
  totalGstAmount?: number;
  fameIIDiscount?: number;
  regAmount?:      number;
  insuranceAmount?: number;
  postGstDiscount?: number;
  finalAmount?:    number;
  totalAmount?:    number;

  // ── FAME II ───────────────────────────────────────────────
  subsidyAmount?:  number;
  fameIIRequired?: boolean;
}

export interface UnifiedSaleReportTotals {
  totalRecords:      number;
  totalItemRate:     number;
  totalTaxable:      number;
  totalSgst:         number;
  totalCgst:         number;
  totalIgst:         number;
  totalFameII:       number;
  totalRegistration: number;
  totalInsurance:    number;
  grandTotal:        number;
  totalAmount:       number;   // from VehicleSale rows
}

// ── One filter, used by BOTH report endpoints ────────────────
export interface UnifiedSaleReportFilter {
  dealerCode?:   string;
  fromDate?:     string;
  toDate?:       string;
  saleType?:     string;
  customerType?: string;
  billType?:     number;
  status?:       string;
  chassisNo?:    string;
  saleBillNo?:   string;
  financier?:    string;   // matched client-side against the resolved financier name (neither API filters on it server-side)
  search?:       string;
  pageIndex:     number;
  pageSize:      number;
}

// ── One response shape, used by the paginated (Sale Bill) endpoint ──
export interface UnifiedSaleReportResponse {
  data:         UnifiedSaleReportViewModel[];
  totalRecords: number;
  pageIndex:    number;
  pageSize:     number;
  totals?:      UnifiedSaleReportTotals;  // optional server totals; client currently recomputes from `data`
}