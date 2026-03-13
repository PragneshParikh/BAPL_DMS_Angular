export interface Form22MasterModel {
  id: number,
  oemmodelId: number;
  oemModelName: string,
  soundLevelHorn: string;
  passbyNoiseLevel: string;
  approvalCertificateNo: string;
  isActive: boolean;

  createdBy: string;
  createdDate: Date;

  updatedBy: string;
  updatedDate: Date;

}