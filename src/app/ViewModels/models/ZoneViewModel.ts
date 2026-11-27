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
  /** 26.11.2026 DealerMaster.IsActive */
  isActive?:    boolean;
  /** 26.11.2026 'Zone Master' (own row in zone_master) | 'State' (dealer's state is in this zone) */
  source?:      string;
}

/** 26.11.2026 GET /api/ZoneMaster/GetZoneDealerCounts */
export interface ZoneDealerCount {
  zone:    string;
  mapped:  number;
  byState: number;
  total:   number;
  active:  number;
}

export interface ZoneDealerCountResponse {
  zones:           ZoneDealerCount[];
  totalDealers:    number;
  activeDealers:   number;
  notInZone:       number;
  notInZoneActive: number;
  notInZoneStates: string[];
}

// Create / update payload — matches ZoneMasterViewModel on backend
export interface ZoneMasterViewModel {
  id:       number;
  zone:     string;
  isActive: boolean;
}