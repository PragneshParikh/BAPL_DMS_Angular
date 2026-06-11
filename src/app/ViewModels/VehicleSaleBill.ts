export interface SaleModel {

  // Sale Info
  saleBillNo: string;
  saleDate: string;
  d2d: string;
  location: string;
  saleType: string;
  saleTypeSwitch: string;
  cashAccount?: string;
  customerName?: string;
  billingName?: string;

  // Vehicle Details
  chassisNo: string;
  itemRate: number | null;
  battery?: string;
  delivered?: string;
  preGSTDiscount: number | null;
  regAmount: number | null;
  insAmount: number | null;
  mfgYear: number | null;
  segment?: string;
  institutional?: string;
  scheme?: string;

  // Extra Charges
  accessoryAmount: number | null;
  discount: number | null;
  handlingCharges: number | null;
  hpAmount: number | null;
  totalAmount: number | null;

  // Accessories
  itemName?: string;
  qty: number | null;
  rate: number | null;

  // Referral
  referralName?: string;
  referralMobile?: string;
  referralEmail?: string;
  referralPoint: number | null;
  referralRemarks?: string;
}

export interface VehicleSaleBillDetailVM {
  id: number;
  chassisNo: string;
  itemRate: number;
  preGstDiscount: number;
  regAmount: number;
  insuranceAmount: number;
  hasDevice: boolean;
  hasKit: boolean;
  isDelivered: boolean;
  segment: string;
  institutionalType: string;
  schemeName: string;
  narration: string;
  finalAmount: number;
  isAgainstExchange: boolean;
}

export interface VehicleSaleBillResponseViewModel {
  id: number;
  saleBillNo: string;
  customerName: string;
  totalAmount: number;
  location: string;
  saleDate: string;
  saleType: string;
  billingName: string;
  referralName: string;
  billType: number;
  financier?: string;
  salesExecutive?: string;
  isD2d: boolean;
  cashAccount?: string;
  status?: string;
  details: VehicleSaleBillDetailVM[];
  selected?: boolean;
  selectedForm22?: boolean;
  selectedInvoice?: boolean;
  customerType?: string;
  
  
}

export interface VehicleSaleChasisRequest {
  dealerCode: string;
  ledgerId: number;
  isD2d: boolean;
  itemCode: string;
}

export interface VehicleSaleChasisResponse {
  itemRate: number;
  preGstDis: number;
  cgstPer: number;
  cgstAmt: number;
  sgstPer: number;
  sgstAmt: number;
  igstPer: number;
  igstAmt: number;
  mfgYear: number;
}

export interface UpdateSaleDetailsVM {
 ChassisNo :string;
 RegisterNo : string;
 SaleDate :Date;
 InsuranceExpDate: Date; 
}