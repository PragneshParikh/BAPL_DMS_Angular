export interface JobTypeModel {
  jobTypeId: number;
  jobtypeName: string;
}
export interface JobCardSearchModel {

  dealerCode: string;
  fromDate?: string;
  toDate?: string;
  serviceLocation?: string;
  jobNo?: number;
  customerName?: string;
  chassisNo?: string;
  registerNo?:string;
}