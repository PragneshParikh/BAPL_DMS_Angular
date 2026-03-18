export interface BatteryCapacity {
  id: number;
  batteryCapacity: string;
  isActive: boolean;
}

export interface BatteryApiResponse {
  message: string;
  data: BatteryCapacity[];
}
