// ── Total Sale Report (Dealer-wise Mapping) ──
// Backs GET {apiUrl}/total-sale-dealer-wise.
// One row per dealer, full financial rollup — server also enforces that
// non-admin/dealer users only ever see their own dealer's row, regardless
// of the dealerCode filter sent.

export interface TotalSaleReportDealerWiseRow {
  dealerCode:            string;
  dealerName:            string;
  dealerCity?:           string;
  dealerState?:          string;

  totalUnitsSold:        number;
  cashCount:             number;
  creditCount:           number;

  totalItemRate:         number;
  totalPreGstDiscount:   number;
  totalTaxableAmount:    number;
  totalSgstAmount:       number;
  totalCgstAmount:       number;
  totalIgstAmount:       number;
  totalFameIIDiscount:   number;
  totalRegAmount:        number;
  totalInsuranceAmount:  number;
  totalPostGstDiscount:  number;
  totalFinalAmount:      number;
  totalAmount:           number;
}

export interface TotalSaleReportDealerWiseResponse {
  rows:        TotalSaleReportDealerWiseRow[];
  grandTotal:  TotalSaleReportDealerWiseRow | null;
}

export interface TotalSaleReportDealerWiseFilter {
  dealerCode?: string;
  fromDate?:   string;
  toDate?:     string;
}