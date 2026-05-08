export interface StockReport {
  dealerName: string;
  dealerCode: string;
  model: string;
  colour: string;
  totalQty: number;
}

export interface DealerStockGroup {
  dealerName: string;
  dealerCode: string;
  items: {
    model: string;
    colour: string;
    totalQty: number;
  }[];
  totalQty: number;
}