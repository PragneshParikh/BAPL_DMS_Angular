export interface OemModelWarranty {
    id?: number;
    oemmodelId: number;
    oemmodelname?:string;
    effectiveDate?: string;   //  change to string
    odoreading?: number;
    durationType?: string;
    duration?: number;
    isB2b?: boolean;
}