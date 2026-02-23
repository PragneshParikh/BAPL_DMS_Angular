import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CRMState } from './crm_reducer';

export const selectCRMState = createFeatureSelector<CRMState>('CRM');

export const selectContactData = createSelector(
    selectCRMState,
    (state: CRMState) => state.Contact
);

export const selectCompanyData = createSelector(
    selectCRMState,
    (state: CRMState) => state.Company
);

export const selectDealData = createSelector(
    selectCRMState,
    (state: CRMState) => state.Deal
);

export const selectLeadData = createSelector(
    selectCRMState,
    (state: CRMState) => state.Lead
);


export const selectCRMLoading = createSelector(
    selectCRMState,
    (state: CRMState) => state.loading
);

export const selectCRMError = createSelector(
    selectCRMState,
    (state: CRMState) => state.error
);

