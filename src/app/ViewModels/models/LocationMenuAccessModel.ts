import { DealerMenuAccessGroup } from './DealerMenuAccessModel';

export interface LocationMenuAccessResponse {
  locationId: number;
  roleId?: string;
  roleName?: string;
  groups: DealerMenuAccessGroup[];
}