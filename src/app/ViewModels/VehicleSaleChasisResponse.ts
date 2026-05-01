  // // export interface VehicleSaleListChasisResponse {
  // //   chassisNo: string;
  // //   itemCode: string;

  // //   dealerRate: number;
  // //   customerRate: number;
  // //   preGstDis: number;

  // //   cgstPer: number;
  // //   cgstAmt: number;

  // //   sgstPer: number;
  // //   sgstAmt: number;

  // //   igstPer: number;
  // //   igstAmt: number;

  // //   mfgYear?: number;
  // // }

  // export interface VehicleSaleListChasisResponse {
  //   chassisNo: string;
  //   itemCode: string;
  //   itemName: string;
  //   itemColor: string;
  //   mfgYear?: number;

  //   batteryNo: string;
  //   converterNo: string;
  //   chargerNo: string;
  //   controllerNo: string;

  //   keyNo: string;
  //   bookNo: string;

  //   dealerPrice?: number;
  //   customerPrice?: number;
  //   dealerCode: string;

  //   batteryChemical: string;
  //   batteryCapacity: string;
  //   batteryMake: string;
  // preGstDisc: number;
  //   stockNo: string;

  //   sgstPer: number;
  //   sgst: number;
  //   cgstPer: number;
  //   cgst: number;
  //   igstPer: number;
  //   igst: number;

    
  // }

  export interface VehicleSaleListChasisResponse {
  chassisNo: string;
  itemCode: string;
  itemName: string;
  itemColor: string;

  mfgYear?: number;

  // 🔋 Battery & Components
  batteryNo?: string;
  converterNo?: string;
  chargerNo?: string;
  controllerNo?: string;

  keyNo?: string;
  bookNo?: string;

  // 💰 Pricing
  dealerPrice?: number;
  customerPrice?: number;
  preGstDisc?: number;

  // 🏢 Dealer
  dealerCode?: string;

  // 🔋 Battery Info
  batteryChemical?: string;
  batteryCapacity?: string;
  batteryMake?: string;

  stockNo?: string;

  // 🧾 GST
  sgstPer?: number;
  sgst?: number;
  cgstPer?: number;
  cgst?: number;
  igstPer?: number;
  igst?: number;

  // ✅ NEW FIELDS (IMPORTANT)
  insNo?: string;
  insStartDate?: Date;
  insExpDate?: Date;

  regNo?: string;

  // 🧾 Extra fields matching backend
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
}