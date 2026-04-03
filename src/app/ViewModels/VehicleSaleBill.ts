export interface SaleModel {

  // Sale Info
  saleDate: string;
  d2d: string;
  location: string;
  saleType: string;
  saleTypeSwitch: string;
  cashAccount: string;
  customerName: string;
  billingName: string;

  // Vehicle Details
  chassisNo: string;
  itemRate: number | null;
  battery: string;
  delivered: string;
  preGSTDiscount: number | null;
  regAmount: number | null;
  insAmount: number | null;
  mfgYear: number | null;
  segment: string;
  institutional: string;
  scheme: string;

  // Extra Charges
  accessoryAmount: number | null;
  discount: number | null;
  handlingCharges: number | null;
  hpAmount: number | null;

  // Accessories
  itemName: string;
  qty: number | null;
  rate: number | null;

  // Referral
  referralName: string;
  referralMobile: string;
  referralEmail: string;
  referralPoint: number | null;
  referralRemarks: string;
}