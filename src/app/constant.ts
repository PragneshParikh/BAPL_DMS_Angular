export enum AccessRoles {
    NoAccess = 1,
    ViewOnly = 2,
    ModifyOnly = 3,
    FullControl = 4
}

export const Gender = [
    { title: 'Male', value: 'male' },
    { title: 'Female', value: 'female' },
    { title: 'Other', value: 'other' },
]

export const TRANSACTION_TYPES = [
    { name: 'B2B', type: 'B2B' },
    { name: 'B2C', type: 'B2C' }
];

export const JobType = [
    { name: 'PDI', value: 'PDI' },
    { name: 'Accidental', value: 'Accidental' },
    { name: 'In Warranty Period', value: 'In Warranty Period' },
    { name: 'Post Warranty Period', value: 'Post Warranty Period' },
    { name: 'Routine', value: 'Routine' },
    { name: 'Transit', value: 'Transit' },
    { name: 'Against Advance Booking', value: 'Against Advance Booking' },
    { name: 'Refurbish', value: 'Refurbish' },
    { name: 'Recall', value: 'Recall' }
];

export const BatteryType = [
    { batterytypeidno: 1, value: 'Li' },
    { batterytypeidno: 2, value: 'LT' },
    { batterytypeidno: 3, value: 'LA' },
    { batterytypeidno: 4, value: 'LFP' }
];

export const BatteryVoltage = [
    { batteryVoltageidno: 1, value: '12 Volt' },
    { batteryVoltageidno: 2, value: '24 Volt' },
    { batteryVoltageidno: 3, value: '32 Volt' },
    { batteryVoltageidno: 4, value: '48 Volt' },
    { batteryVoltageidno: 5, value: '52 Volt' },
    { batteryVoltageidno: 6, value: '60 Volt' },
    { batteryVoltageidno: 7, value: '72 Volt' }
];

export const JobSource = [
    { name: 'Advance Booking', value: 'Advance Booking' },
    { name: 'Walk In', value: 'Walk In' },
    { name: 'RSA', value: 'RSA' },
    { name: 'Door Step Service', value: 'Door Step Service' },
    { name: 'Mega Camp', value: 'Mega Camp' }
];

export const locationAreaMaster = [
    { id: 1, name: 'Showroom' },
    { id: 2, name: 'Workshop' },
    { id: 3, name: 'Yard' }
];

export const LedgerTypes = [
    { name: 'Company', value: 'Company' },
    { name: 'Dealer', value: 'Dealer' },
    { name: 'Financier', value: 'Financier' },
    { name: 'Institutional', value: 'Institutional' },
    { name: 'Insurance', value: 'Insurance' },
    { name: 'Party', value: 'Party' },
    { name: 'Supplier', value: 'Supplier' },
    {name:'Receipt Party',value:'Receipt'}
]

export const PrefixTypes = [
    { name: 'Invoice', value: 'Invoice' },
    { name: 'Purchase Order', value: 'Purchase Order' },
    { name: 'Quotation', value: 'Quotation' }
]

export const SaleTypeOptions = [
    { name: 'Cash Sale', value: 'Cash' },
    { name: 'Credit Sale', value: 'Credit' }
];

export const BillingTypeOptions = [
    { id: 1, value: 'Dealer Sale/Institutional' },
    { id: 2, value: 'Counter Sale[Single]' }
];

export const BillFromOptions = [
    { name: 'Direct Billing', value: 'direct' },
    { name: 'Against Receipt', value: 'receipt' },
    { name: 'Against Delivery', value: 'delivery' }
];

export const CashTypeOptions = [
    { name: 'Cash', value: 'Cash' },
    { name: 'Bank Transfer', value: 'Bank' },
    { name: 'Cheque', value: 'Cheque' },
    { name: 'UPI', value: 'UPI' },
];

export const IssueTypes = [
    { id: 1, name: 'Paid' },
    { id: 2, name: 'U/W' },
    { id: 3, name: 'FSC' },
    { id: 4, name: 'Goodwill' }
]

export const userRole = [
    { roleId: 1, value: 'SuperAdmin' },
    { roleId: 2, value: 'Dealer' }
]

export const ErpOptions = [
    { name: 'Invoiced', value: 'Invoiced' },
    { name: 'Proforma Created', value: 'PerformaCreated' }
    //     { name: 'Pending ERP Submission', value: 'Pending' }
];

export const RateTypes = [
    { id: 1, title: 'Single' },
    // { id: 2, title: 'Multi' }
]

export const DurationTypes = [
    { id: 1, title: 'Month' },
    { id: 2, title: 'Year' }
];

export const OemmodelServiceSeq = [
    { Id: 1, value: '1st Service' },
    { Id: 2, value: '2nd Service' },
    { Id: 3, value: '3rd Service' },
    { Id: 4, value: '4th Service' },
    { Id: 5, value: '5th Service' },
    { Id: 6, value: '6th Service' }
]

export const OemmodelServiceFrom = [
    { Id: 1, value: 'Date of Purchase' },
    { Id: 2, value: 'Date of Sale' }
]

export const ModuleTypes = [
    { name: 'counter_bill', moduleName: 'Counter Bill' },
    { name: 'free_service_claim_invoice', moduleName: 'Free Service Claim Invoice' },
    { name: 'warranty_claim_invoice', moduleName: 'Warranty Claim Invoice' },
    { name: 'free_service_claim', moduleName: 'Free Service Claim' },
    { name: 'ffir_prefix', moduleName: 'FFIR' },
    { name: 'purchase_order', moduleName: 'Purchase Order' },
    { name: 'Repair_bill', moduleName: 'Repair Bill' },
    { name: 'hsrp_order', moduleName: 'HSRP Order' },
    { name: 'sale_bill', moduleName: 'Vehicle Sale Bill' },
    { name: 'receipt_entry', moduleName: 'Receipt Entry' },
    { name: 'vehicle_transfer', moduleName: 'Vehicle Stock Transfer' },
    { name: 'job_card', moduleName: 'Job Card' }
]

export const EmployeeDesignations = [
    { id: 1, value: 'SalesExecutive' },

]
export const FFIRPresentVehicleStatus = [
    { id: 1, value: 'Complaint Resolved' },
    { id: 2, value: 'Running with Problem' },
    { id: 3, value: 'Under Observation' },
    { id: 4, value: 'Off Road' }
]

export const FFIRIssueType = [
    { id: 1, value: 'U/W' },
    { id: 2, value: 'FOC' },
    { id: 3, value: 'GoodWill' }
]

export const FFIRTypeRoadSurface = [
    { id: 1, value: 'National Highway/ Four lane roads' },
    { id: 2, value: 'City roads/ State highways/ 2 Lane roads with slight undulation/Pot holes' },
    { id: 3, value: 'Single lane/ Roads with heavy undulation/ Pot holes/ Bumps' },
    { id: 4, value: 'Kutcha Road : Unpaved road' }
]

export const FFIRPurposeofCIR = [
    { id: 1, value: 'For Warranty Approval' },
    { id: 2, value: 'For Information' },
    { id: 3, value: 'For Technical Assistance' }
]

export const APIUniqueList = [
    { value: 'color', name: 'Color' },
    { value: 'dealermaster', name: 'Dealer' },
    { value: 'hsncodemaster', name: 'HSNCodeMaster' },
    { value: 'vehicleinward', name: 'Vehicle Inward' },
    { value: 'purchaseorder', name: 'Purchase Order' },
    { value: 'locationmaster', name: 'Location Master' },
    { value: 'dealermaster', name: 'Dealer Master' },
    { value: 'itemmaster', name: 'Item Master' }
]

export const PO_STATUSES = [
    { name: 'Submitted To ERP', value: 'Submited To ERP' },
    { name: 'Not Submitted To ERP', value: 'Not Submited To ERP' }
]

export const cashAccounts = [
    { id: 1, accountName: 'Bank Transfer' },
    { id: 2, accountName: 'Cash' },
    { id: 3, accountName: 'Cheque' },
    { id: 4, accountName: 'UPI Payment' }
]

export const SchemeName = [
    { id: 1, value: 'Government Employee' },
    { id: 2, value: 'Bussiness' },
    { id: 3, value: 'House Wife' },
    { id: 4, value: 'Private Employee' },
    { id: 5, value: 'Professionals' },
    { id: 6, value: 'Student' }
]

export const zonesData = [
    { id: 60, name: 'East' },
    { id: 63, name: 'West' },
    { id: 61, name: 'North' },
    { id: 62, name: 'South' },
    { id: 59, name: 'Central' }
];

export const conditionModule = [
    { Id: 1, ConditionName: 'Job Card' },
    { Id: 2, ConditionName: 'Repair Bill' },
    { Id: 3, ConditionName: 'Receipt Entry' },
    { Id: 4, ConditionName: 'FFIR' },
    { Id: 5, ConditionName: 'Warranty Claim' },
    { Id: 6, ConditionName: 'Vehicle Sale Bill' },
    { Id: 7, ConditionName: 'Counter Bill' },
    { Id: 8, ConditionName: 'EBW Invoice Creation' }
];

