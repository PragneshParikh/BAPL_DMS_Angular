export interface DesignationModel {
  designationId: number;
  abbreviation?: string;          // was designationCode
  designationName: string;
  departmentId?: number | null;
  isActive: boolean;
  createdBy?: string | null;
  createdDate?: string;
  modifiedBy?: string | null;
  modifiedDate?: string | null;
}