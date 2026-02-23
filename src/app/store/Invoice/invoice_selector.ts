import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InvoiceState } from './invoice_reducer';

export const selectDataState = createFeatureSelector<InvoiceState>('Invoice');

export const selectInvoiceData = createSelector(
    selectDataState,
    (state: InvoiceState) => state.Invoice
);

export const selectInvoiceLoading = createSelector(
    selectDataState,
    (state: InvoiceState) => state.loading
);

export const selectInvoiceError = createSelector(
    selectDataState,
    (state: InvoiceState) => state.error
);

