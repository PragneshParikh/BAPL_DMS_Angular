// ── Model Wise Sale Report (Count-wise) — pivoted Dealer x Model ──
// Backs GET {apiUrl}/model-wise-sale-count.

export interface ModelWiseSalePivotRow {
  dealerCode:   string;
  dealerName:   string;
  // Key = model name, Value = count sold by this dealer. Backend guarantees
  // one entry per name in ModelWiseSalePivotResponse.modelNames (0 if none
  // sold), so this can always be indexed directly without a fallback.
  modelCounts:  { [modelName: string]: number };
  total:        number;   // row total, horizontal sum across every model
}

export interface ModelWiseSalePivotResponse {
  modelNames:    string[];                          // column order
  rows:          ModelWiseSalePivotRow[];
  columnTotals:  { [modelName: string]: number };    // vertical sum per model
  grandTotal:    number;
}

export interface ModelWiseSaleCountFilter {
  dealerCode?: string;
  fromDate?:   string;
  toDate?:     string;
}