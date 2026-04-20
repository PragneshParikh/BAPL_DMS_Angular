export interface VehicleSaleListChasisResponse {
  chassisNo: string;
  itemCode: string;

  dealerRate: number;
  customerRate: number;
  preGstDis: number;

  cgstPer: number;
  cgstAmt: number;

  sgstPer: number;
  sgstAmt: number;

  igstPer: number;
  igstAmt: number;

  mfgYear?: number;
}