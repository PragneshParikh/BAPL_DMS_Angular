export interface LmsleadMaster {
  Leadid: any;
  id: number;
  leadid: number;
  name: string;
  mobile: string;
  email?: string;
  date: string; // ISO date string, e.g. "2026-03-26T00:00:00Z"
  area?: string;
  city: string;
  brancharea: string;
  company: string;
  pincode?: number;
  time?: string; // Could be "HH:mm:ss" or ISO time string
  branchpin: number;
  model: string;
  variant: string;
  dealerId?: number;
  dealercode: string;
  productcode?: string;
  sourceapp: string;
  colorId?: number;
  color?: string;
  createdBy: string;
  createdDate: string; // ISO date string
  updatedBy?: string;
  updatedDate?: string; // ISO date string or null
}