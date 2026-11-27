// src/app/components/b2b-jobcard/models/b2b-jobcard.model.ts
// B2B Job Card (24.11.2026) - mirrors DMSBAPLAPI DMS_BAPL_Data/JobCardScanner/B2BJobCardModels.cs (camelCase JSON).
// All data comes from the JobCardScanner database through api/b2b-jobcard.

export interface B2BDealer {
  id: string;
  code: string;
  name: string;
  dmsDealerCode?: string | null;
  city?: string | null;
}

/** dbo.ServiceMenuMasters row - Job Type -> Service Head -> Priority cascade */
export interface B2BServiceMenuRow {
  id: string;
  jobTypeId: number;
  jobTypeName: string;
  serviceHeadId: number;
  serviceHeadName: string;
  /** short code shown in the dropdown */
  priorityValue: string;
  /** posted value (Normal / High / Urgent) */
  priorityLabel: string;
  sortOrder: number;
}

export interface B2BIdName { id: number; name: string; }
export interface B2BPriority { value: string; label: string; }

export interface B2BComplaint {
  id: string;
  complaintText: string;
  sortOrder: number;
}

export interface B2BWorkshop {
  locCode: string;
  locName: string;
}

export interface B2BMasters {
  serviceMenu: B2BServiceMenuRow[];
  complaints: B2BComplaint[];
  workshops: B2BWorkshop[];
  dealer?: B2BDealer | null;
  dealerMessage?: string | null;
}

export interface B2BVehicleSuggestion {
  /** JobCardScanner vehicle id; null for DMS sale / service history hits */
  vehicleId?: string | null;
  /** JobCardScanner / DMS sale / Service history */
  source: string;
  saleDate?: string | null;
  chassisNo?: string | null;
  regNo?: string | null;
  model?: string | null;
  customerName?: string | null;
  dealerCode?: string | null;
  jobs: number;
}

/** dealer first; when nothing matches there, every dealer (scope 'all') */
export interface B2BVehicleSuggestResult {
  scope: 'dealer' | 'all';
  items: B2BVehicleSuggestion[];
}

/** Supervisor/Advisor (JobCardScanner Users, Role Supervisor) / Technician (JobCardScanner Technicians) of a workshop */
export interface B2BStaff { id: string; name: string; atLocation: boolean; locationName?: string | null; }
export interface B2BStaffLists { supervisors: B2BStaff[]; technicians: B2BStaff[]; }

export interface B2BPhoto {
  id: string;
  url: string;
  caption?: string | null;
  stage: string;
  createdAt: string;
}

export interface B2BCustomer {
  id?: string | null;
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface B2BVehicle {
  id?: string | null;
  chassisNo?: string | null;
  regNo?: string | null;
  model?: string | null;
  variant?: string | null;
  color?: string | null;
  batteryNo?: string | null;
  motorNo?: string | null;
  controllerNo?: string | null;
  converterNo?: string | null;
  chargerNo?: string | null;
  purchaseDate?: string | null;
  nextServiceDueDate?: string | null;
  insuranceExpiry?: string | null;
  odometer: number;
  dealerCode?: string | null;
}

/** one past JobCardScanner job card of the vehicle */
export interface B2BHistoryRow {
  id: string;
  jobCardNumber: string;
  createdAt: string;
  regNo?: string | null;
  odometerAtCheckIn: number;
  jobType?: string | null;
  serviceHead?: string | null;
  priority?: string | null;
  serviceLocation?: string | null;
  status?: string | null;
  stage?: string | null;
  dealerCode?: string | null;
  dealerName?: string | null;
  complaints?: string | null;
  /** customer / party on that job card (27.11.2026) */
  partyName?: string | null;
  customerName?: string | null;
  /** B2B (JobCardScanner) / DMS job card / Service history - set by the form when it merges the sources */
  source?: string | null;
}

export interface B2BVehicleCard {
  found: boolean;
  vehicle?: B2BVehicle | null;
  customer?: B2BCustomer | null;
  previousOdometer?: number | null;
  openJobCardNumber?: string | null;
  history: B2BHistoryRow[];
}

export interface B2BJobCardFilter {
  dealerCode?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  jobNo?: string | null;
  chassisNo?: string | null;
  regNo?: string | null;
  customerName?: string | null;
  serviceLocationCode?: string | null;
  status?: string | null;
  pageIndex: number;
  pageSize: number;
}

export interface B2BJobCardListRow {
  id: string;
  jobCardNumber: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  stage?: string | null;
  manualJobNo?: string | null;
  serviceLocation?: string | null;
  jobType?: string | null;
  jobSource?: string | null;
  serviceHead?: string | null;
  priority: string;
  supervisor?: string | null;
  technician?: string | null;
  chassisNo?: string | null;
  regNo?: string | null;
  model?: string | null;
  customerName?: string | null;
  customerMobile?: string | null;
  odometerAtCheckIn: number;
  dealerCode?: string | null;
  complaints?: string | null;
}

export interface B2BPaged<T> {
  data: T[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
}

export interface B2BJobCardDetail {
  id: string;
  jobCardNumber: string;
  status: string;
  stage?: string | null;
  canEdit: boolean;
  dealerCode?: string | null;
  dealerName?: string | null;
  jobTypeId?: number | null;
  jobTypeName?: string | null;
  serviceHeadId?: number | null;
  serviceHeadName?: string | null;
  serviceTypeName?: string | null;
  priority: string;
  serviceLocationCode?: string | null;
  serviceLocationName?: string | null;
  jobSourceId?: number | null;
  jobSourceName?: string | null;
  manualJobNo?: string | null;
  couponNo?: string | null;
  supervisorName?: string | null;
  technicianName?: string | null;
  assignedTechnicianName?: string | null;
  odometerAtCheckIn: number;
  batteryLevelAtCheckIn?: number | null;
  expectedDeliveryAt?: string | null;
  customerVoice?: string | null;
  createdAt: string;
  updatedAt: string;
  complaints: string[];
  photos: B2BPhoto[];
  vehicle: B2BVehicle;
  customer: B2BCustomer;
}

export interface B2BJobCardCreateRequest {
  dealerCode?: string | null;
  chassisNo: string;
  regNo?: string | null;
  model?: string | null;
  variant?: string | null;
  color?: string | null;
  batteryNo?: string | null;
  motorNo?: string | null;
  controllerNo?: string | null;
  converterNo?: string | null;
  chargerNo?: string | null;
  purchaseDate?: string | null;
  customerName?: string | null;
  customerMobile?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  jobTypeId: number | null;
  serviceHeadId: number | null;
  priority: string;
  serviceLocationCode: string;
  serviceLocationName?: string | null;
  jobSourceId?: number | null;
  jobSourceName?: string | null;
  manualJobNo?: string | null;
  couponNo?: string | null;
  /** 27.11.2026 - Job Category on the form: 'B2B' (default) or 'B2C' */
  jobCategory?: 'B2B' | 'B2C' | null;
  supervisorName?: string | null;
  technicianName?: string | null;
  odometerAtCheckIn: number | null;
  batteryLevelAtCheckIn?: number | null;
  expectedDeliveryAt: string | null;
  customerVoice?: string | null;
  complaints: string[];
}

export interface B2BJobCardUpdateRequest {
  priority?: string | null;
  expectedDeliveryAt?: string | null;
  assignedTechnicianName?: string | null;
  customerState?: string | null;
}

export interface B2BSaveResult {
  id: string;
  jobCardNumber: string;
  message: string;
}

/** JobCardScanner JobCardStatus enum names */
export const B2B_STATUSES = ['Open', 'InProgress', 'PendingCustomerApproval', 'PendingQc', 'PendingClosure', 'PendingInvoice', 'Closed', 'Cancelled'];
