import { DealerMasterViewModel } from "./DealerMasterViewModel";

export interface DealerApiResponse {
  message: string;
  data: DealerMasterViewModel[];
}
