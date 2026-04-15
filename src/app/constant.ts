export enum AccessRoles {
    NoAccess = 1,
    ViewOnly = 2,
    ModifyOnly = 3,
    FullControl = 4
}

export const Gender = [
    { title: 'Male', value: 'male' },
    { title: 'Female', value: 'female' },
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
    { name: 'Party', value: 'Party' }
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
    { name: 'Dealer Sale/Institutional', value: 'Dealer Sale/Institutional' },
    { name: 'Counter Sale[Single]', value: 'Counter Sale[single]' }
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
    { name: 'Paid', value: 'paid' },
    { name: 'U/W', value: 'u/w' },
    { name: 'FOC', value: 'foc' },
    { name: 'Goodwill', value: 'goodwill' }
]