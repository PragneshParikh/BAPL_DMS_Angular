export interface ModelWiseVariantStockCountFilter {
  dealerCode?: string;
  fromDate?:   string;
  toDate?:     string;
}

export interface ModelWiseVariantStockPivotRow {
  modelName:     string;
  variantCounts: { [variant: string]: number };
  total:         number;
}

export interface ModelWiseVariantStockPivotResponse {
  variantNames: string[];
  rows:         ModelWiseVariantStockPivotRow[];
  columnTotals: { [variant: string]: number };
  grandTotal:   number;
}