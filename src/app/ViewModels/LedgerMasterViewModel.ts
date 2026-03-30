export interface LedgerMaster {
  id: number;
  ledgerCode?: string;
  ledgerName?: string;
  ledgerType?: string;
  gstno?: string;
  pan?: string;
  aadharNumber?: string;
  mobileNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  eMail?: string;
  gender?: string;
  dateOfBirth?: string;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
}