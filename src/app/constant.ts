import { values } from "lodash";

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
    {name:'PDI', value:'PDI'},
    {name:'Accidental',value:'Accidental'},
    {name:'In Warranty Period', value:'In Warranty Period'},
    {name:'Post Warranty Period', value:'Post Warranty Period'},
    {name:'Routine', value:'Routine'},
    {name:'Transit', value:'Transit'},
    {name:'Against Advance Booking', value:'Against Advance Booking'},
    {name:'Refurbish', value:'Refurbish'},
    {name:'Recall', value:'Recall'}
];

export const JobSource = [
    {name:'Advance Booking', value:'Advance Booking'},
    {name:'Walk In',value:'Walk In'},
    {name:'RSA', value:'RSA'},
    {name:'Door Step Service', value:'Door Step Service'},
    {name:'Mega Camp', value:'Mega Camp'}
];