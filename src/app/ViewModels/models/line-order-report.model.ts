export interface LineOrderReportRequest {
  //lineType: 'Labour' | 'Part';
  lineType: 'All' | 'Labour' | 'Part';
  fromDate: string;
  toDate: string;
  dealerCode?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface LineOrderReportPagedResponse {
  data: any[];
  totalRecords: number;
}