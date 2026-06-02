

export interface VehicleSaleListChasisResponse {
  chassisNo: string;
  itemCode: string;
  itemName: string;
  itemColor: string;

  mfgYear?: number;

  //  Battery & Components
  batteryNo?: string;
  converterNo?: string;
  chargerNo?: string;
  controllerNo?: string;

  keyNo?: string;
  bookNo?: string;

  //  Pricing
  dealerPrice?: number;
  customerPrice?: number;
  preGstDisc?: number;

  //  Dealer
  dealerCode?: string;

  //  Battery Info
  batteryChemical?: string;
  batteryCapacity?: string;
  batteryMake?: string;

  stockNo?: string;

  //  GST
  sgstper?: number;
  sgst?: number;
  cgstper?: number;
  cgst?: number;
  igstper?: number;
  igst?: number;


  insNo?: string;
  insStartDate?: Date;
  insExpDate?: Date;

  regNo?: string;

  //  Extra fields matching backend
  modelName?: string;
  colour?: string;

  battery?: string;
  convertorNo?: string;
  chargerNoFull?: string;
  controllerNoFull?: string;

  key?: string;
  book?: string;

  extWarranty?: string;

  stockDetailsNo?: string;
  vcu?: string;
  customerSaleDate?: Date;
  pdiStatus?: string;
  fameIIAmnt?: number;
  postGstDisc?: number;
  proformaCreated?: string;
}