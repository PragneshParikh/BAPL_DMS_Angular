// for view
export interface HsnTaxFormModel {
    id: number;
    hsncode: string;
    selectedATax: any;   // dropdown object
    ataxCode: string;
    taxCode: string;
    taxRate: number;
    stateflag: string;
    effectivedate: string;
    createdBy: string;
}

// for api payload
export interface AddHsnTaxPayload {
    hsncode: string;
    ataxCode: string;
    stateFlag: string;
    effectiveDate: string;
    createdBy: string;
    
}