export interface DepartmentModel {
  departmentId: number;
  abbreviation?: string;       // was departmentCode
  departmentName: string;
  isActive: boolean;
  createdBy?: string | null;
  createdDate?: string;
  modifiedBy?: string | null;
  modifiedDate?: string | null;
}