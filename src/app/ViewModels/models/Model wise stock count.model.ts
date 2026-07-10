export interface ModelWiseStockPivotRow {
  dealerCode:   string;
  dealerName:   string;
  modelCounts:  { [modelName: string]: number };
  total:        number;
}

export interface ModelWiseStockPivotResponse {
  modelNames:    string[];
  rows:          ModelWiseStockPivotRow[];
  columnTotals:  { [modelName: string]: number };
  grandTotal:    number;
}

export interface ModelWiseStockCountFilter {
  dealerCode?: string;
  fromDate?:   string;
  toDate?:     string;
}