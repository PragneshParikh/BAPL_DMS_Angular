// Matches ZoneViewModel returned by GET /api/ZoneMaster/GetAll
export interface ZoneViewModel {
  id:       number;
  zone:     string;
  isActive: boolean;
}

// Matches ZoneDealerViewModel returned by GET /api/ZoneMaster/GetDealersByZone/{zone}
export interface ZoneDealerViewModel {
  zoneMasterId: number;
  zone:         string;
  dealerId:     number;
  dealerName:   string;
  dealerCode:   string;
  city:         string;
  state:        string;
  cityName:     string;
  stateName:    string;
}

// Create / update payload — matches ZoneMasterViewModel on backend
export interface ZoneMasterViewModel {
  id:       number;
  zone:     string;
  isActive: boolean;
}