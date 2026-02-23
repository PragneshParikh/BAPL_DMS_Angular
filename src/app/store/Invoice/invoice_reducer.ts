import { Action, createReducer, on } from '@ngrx/store';
import { deleteInvoiceSuccess, fetchInvoiceListData, fetchInvoiceListFailure, fetchInvoiceListSuccess } from './invoice_action';

export interface InvoiceState {
    Invoice: any[];
    loading: boolean;
    error: any;
}

export const initialState: InvoiceState = {
    Invoice: [],
    loading: false,
    error: null,
};

export const InvoiceReducer = createReducer(
    initialState,
    // Contact
    on(fetchInvoiceListData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchInvoiceListSuccess, (state, { Invoice }) => {
        return { ...state, Invoice, loading: false };
    }),
    on(fetchInvoiceListFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),
  
    on(deleteInvoiceSuccess, (state, { id }) => {
        const updatedinvoice = state.Invoice.filter((invoice) => !id.includes(invoice._id));
        return { ...state, Invoice: updatedinvoice, error: null };
      }),

);

// Selector
export function reducer(state: InvoiceState | undefined, action: Action) {
    return InvoiceReducer(state, action);
}
