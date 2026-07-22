export interface LabourMasterUpdateViewModel {
  id: number;
  labourCode: string;
  labourDescription: string;
  labourRate: number | null;
  hsnCode: string | null;
  effectiveDate: string | Date | null;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  oemModelName: string;
  cityTier: number | null;
  isLabourRateActive: boolean | null;
  jobType: number | null;
  serviceHead: number | null;
  servicetype: number | null;
  jobTypeName: string | null;
  serviceHeadName: string | null;
  servicetypeName: string | null;
  createdDate: string | Date;
  updatedBy: string | null;
  updatedDate: string | Date | null;
}

export interface PartWiseLabourMasterRateViewModel {
  id: number;
  labourCode: string;
  labourName: string;
  partCode: string;
  partDescription: string;
  oemModelName: string;
  cityTier: number | null;
  labourRate: number | null;
  labourHours: number | null;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  jobType: number | null;
  dealerCode: string;
  hsnCode: string;
  effectiveDate: string | Date | null;
  serviceHead: number | null;
  servicetype: number | null;
  isActive: boolean | null;
  jobTypeName: string | null;
  serviceHeadName: string | null;
  servicetypeName: string | null;
  createdDate: string | Date | null;
  updatedBy: string | null;
  updatedDate: string | Date;
}

export interface LabourRateDropDown {
  labourId: number;
  labourCode: string;
  labourName: string;
  labourDescription: string;
  oemModelName: string;
  labourRate: number | null;
  labourHsnCode: string;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  custState: string | null;
  dealerState: string | null;
}