import { createAction, props } from '@ngrx/store';
import { ContactsModel, CompaniesModel, DealModel, LeadsModel } from './crm_model';

// contact
export const fetchCrmContactData = createAction('[Data] Fetch CrmContact');
export const fetchCrmContactSuccess = createAction('[Data] Fetch CrmContact Success',props<{ Contact: ContactsModel[] }>());
export const fetchCrmContactFailure = createAction('[Data] Fetch CrmContact Failure', props<{ error: string }>());

// Company
export const fetchCrmCompanyData = createAction('[Data] Fetch CrmCompany');
export const fetchCrmCompanySuccess = createAction('[Data] Fetch CrmCompany Success',props<{ Company: CompaniesModel[] }>());
export const fetchCrmCompanyFailure = createAction('[Data] Fetch CrmCompany Failure', props<{ error: string }>());

// Deal
export const fetchCrmDealData = createAction('[Data] Fetch CrmDeal');
export const fetchCrmDealSuccess = createAction('[Data] Fetch CrmDeal Success',props<{ Deal: DealModel[] }>());
export const fetchCrmDealFailure = createAction('[Data] Fetch CrmContact Failure', props<{ error: string }>());

// Lead
export const fetchCrmLeadData = createAction('[Data] Fetch CrmLead');
export const fetchCrmLeadSuccess = createAction('[Data] Fetch CrmLead Success',props<{ Lead: LeadsModel[] }>());
export const fetchCrmLeadFailure = createAction('[Data] Fetch CrmLead Failure', props<{ error: string }>());

// Add Contact Data
export const addContact = createAction(
    '[Data] Add Contact',
    props<{ newData: ContactsModel }>()
);
export const addContactSuccess = createAction(
    '[Data] Add Contact Success',
    props<{ newData: ContactsModel }>()
);
export const addContactFailure = createAction(
    '[Data] Add Contact Failure',
    props<{ error: string }>()
);

// Update Contact Data
export const updateContact = createAction(
    '[Data] Update Contact',
    props<{ updatedData: ContactsModel }>()
);
export const updateContactSuccess = createAction(
    '[Data] Update Contact Success',
    props<{ updatedData: ContactsModel }>()
);
export const updateContactFailure = createAction(
    '[Data] Update Contact Failure',
    props<{ error: string }>()
);


// Delete Contact Data
export const deleteContact = createAction(
    '[Data] Delete Contact',
    props<{ id: string }>()
);
export const deleteContactSuccess = createAction(
    '[Data] Delete Contact Success',
    props<{ id: string }>()
);
export const deleteContactFailure = createAction(
    '[Data] Delete Contact Failure',
    props<{ error: string }>()
);

// Add Comapny Data
export const addCompany = createAction(
    '[Data] Add Comapny',
    props<{ newData: CompaniesModel }>()
);
export const addCompanySuccess = createAction(
    '[Data] Add Company Success',
    props<{ newData: CompaniesModel }>()
);
export const addCompanyFailure = createAction(
    '[Data] Add Company Failure',
    props<{ error: string }>()
);

// Update Company Data
export const updateCompany = createAction(
    '[Data] Update Company',
    props<{ updatedData: CompaniesModel }>()
);
export const updateCompanySuccess = createAction(
    '[Data] Update Company Success',
    props<{ updatedData: CompaniesModel }>()
);
export const updateCompanyFailure = createAction(
    '[Data] Update Company Failure',
    props<{ error: string }>()
);


// Delete Company Data
export const deleteCompany = createAction(
    '[Data] Delete Company',
    props<{ id: string }>()
);
export const deleteCompanySuccess = createAction(
    '[Data] Delete Company Success',
    props<{ id: string }>()
);
export const deleteCompanyFailure = createAction(
    '[Data] Delete Company Failure',
    props<{ error: string }>()
);

// Add Lead Data
export const addLead = createAction(
    '[Data] Add Lead',
    props<{ newData: LeadsModel }>()
);
export const addLeadSuccess = createAction(
    '[Data] Add Lead Success',
    props<{ newData: LeadsModel }>()
);
export const addLeadFailure = createAction(
    '[Data] Add Lead Failure',
    props<{ error: string }>()
);

// Update Lead Data
export const updateLead = createAction(
    '[Data] Update Lead',
    props<{ updatedData: LeadsModel }>()
);
export const updateLeadSuccess = createAction(
    '[Data] Update Lead Success',
    props<{ updatedData: LeadsModel }>()
);
export const updateLeadFailure = createAction(
    '[Data] Update Lead Failure',
    props<{ error: string }>()
);


// Delete Lead Data
export const deleteLead = createAction(
    '[Data] Delete Lead',
    props<{ id: string }>()
);
export const deleteLeadSuccess = createAction(
    '[Data] Delete Lead Success',
    props<{ id: string }>()
);
export const deleteLeadFailure = createAction(
    '[Data] Delete Lead Failure',
    props<{ error: string }>()
);

