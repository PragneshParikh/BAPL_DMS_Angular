export interface LabourItem {

  labourCode: string;
  description: string;

  qty: number;
  rate: number;

  discount: number;
  discountType: string;

  cgst: number;
  sgst: number;
  igst: number;

  taxableAmount: number;
  taxAmount: number;
  netAmount: number;

  issuetypeName : string;
  issuetypeId:number;
  igstAmount:number;
  technician: string;
  waveRate : number;
  FirstFill: string;
  FirstFillStock : number;

}

export interface PartItem{

  qty: number;
  rate: number;
  discount: number;
  taxableAmount: number;
  netAmount: number;

  cgst: number;
  sgst: number;
  igst: number;

  igstAmount:number;

}