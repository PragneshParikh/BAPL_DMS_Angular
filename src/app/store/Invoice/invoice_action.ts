import { createAction, props } from '@ngrx/store';
import { InvoiceListModel } from './invoice_model';

// Product
export const fetchInvoiceListData = createAction('[Data] Fetch InvoiceList');
export const fetchInvoiceListSuccess = createAction('[Data] Fetch InvoiceList Success',props<{ Invoice: InvoiceListModel[] }>());
export const fetchInvoiceListFailure = createAction('[Data] Fetch InvoiceList Failure', props<{ error: string }>());

// Delete Invoice Data
export const deleteInvoice = createAction(
    '[Data] Delete Invoice',
    props<{ id: string }>()
);
export const deleteInvoiceSuccess = createAction(
    '[Data] Delete Invoice Success',
    props<{ id: string }>()
);
export const deleteInvoiceFailure = createAction(
    '[Data] Delete Invoice Failure',
    props<{ error: string }>()
);