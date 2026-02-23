import { Action, createReducer, on } from '@ngrx/store';
import { addCompanySuccess, addContactSuccess, addLeadSuccess, deleteCompanySuccess, deleteContactSuccess, deleteLeadSuccess, fetchCrmCompanyData, fetchCrmCompanyFailure, fetchCrmCompanySuccess, fetchCrmContactData, fetchCrmContactFailure, fetchCrmContactSuccess, fetchCrmDealData, fetchCrmDealFailure, fetchCrmDealSuccess, fetchCrmLeadData, fetchCrmLeadFailure, fetchCrmLeadSuccess, updateCompanySuccess, updateContactSuccess, updateLeadSuccess } from './crm_action';

export interface CRMState {
    Contact: any[];
    Company: any[];
    Deal: any[];
    Lead: any[];
    loading: boolean;
    error: any;
}

export const initialState: CRMState = {
    Contact: [],
    Company: [],
    Deal: [],
    Lead: [],
    loading: false,
    error: null,
};

export const CRMReducer = createReducer(
    initialState,
    // Contact
    on(fetchCrmContactData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchCrmContactSuccess, (state, { Contact }) => {
        return { ...state, Contact, loading: false };
    }),
    on(fetchCrmContactFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addContactSuccess, (state, { newData }) => {
        return { ...state, Contact: [newData, ...state.Contact], error: null };
    }),

    on(updateContactSuccess, (state, { updatedData }) => {
        return {
            ...state, Contact: state.Contact.map((contacts) => contacts._id === updatedData._id ? updatedData : contacts), error: null
        };
    }),

    on(deleteContactSuccess, (state, { id }) => {
        const updatedContact = state.Contact.filter((contacts) => !id.includes(contacts._id));
        return { ...state, Contact: updatedContact, error: null };
    }),

    // Company
    on(fetchCrmCompanyData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchCrmCompanySuccess, (state, { Company }) => {
        return { ...state, Company, loading: false };
    }),
    on(fetchCrmCompanyFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addCompanySuccess, (state, { newData }) => {
        return { ...state, Company: [newData, ...state.Company], error: null };
    }),

    on(updateCompanySuccess, (state, { updatedData }) => {
        return {
            ...state, Company: state.Company.map((Companys) => Companys._id === updatedData._id ? updatedData : Companys), error: null
        };
    }),

    on(deleteCompanySuccess, (state, { id }) => {
        const updatedCompany = state.Company.filter((Company) => !id.includes(Company._id));
        return { ...state, Company: updatedCompany, error: null };
    }),

    // Deal
    on(fetchCrmDealData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchCrmDealSuccess, (state, { Deal }) => {
        return { ...state, Deal, loading: false };
    }),
    on(fetchCrmDealFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    // Lead
    on(fetchCrmLeadData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchCrmLeadSuccess, (state, { Lead }) => {
        return { ...state, Lead, loading: false };
    }),
    on(fetchCrmLeadFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addLeadSuccess, (state, { newData }) => {
        return { ...state, Lead: [newData, ...state.Lead], error: null };
    }),

    on(updateLeadSuccess, (state, { updatedData }) => {
        return {
            ...state, Lead: state.Lead.map((Leads) => Leads._id === updatedData._id ? updatedData : Leads), error: null
        };
    }),

    on(deleteLeadSuccess, (state, { id }) => {
        const updatedLead = state.Lead.filter((Lead) => !id.includes(Lead._id));
        return { ...state, Lead: updatedLead, error: null };
    }),

);

// Selector
export function reducer(state: CRMState | undefined, action: Action) {
    return CRMReducer(state, action);
}
