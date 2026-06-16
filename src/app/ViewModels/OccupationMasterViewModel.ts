export interface Occupation {
  id: number;
  occupationName: string;
  isActive: boolean;
}

export interface OccupationApiResponse {
  success: boolean;
  message?: string;
  data: Occupation[];
}