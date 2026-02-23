import { createAction, props } from '@ngrx/store';
import { OrdersModel, TransactionsModel } from './crypto_model';

// Order
export const fetchCryptoOrderData = createAction('[Data] Fetch CryptoOrder');
export const fetchCryptoOrderSuccess = createAction('[Data] Fetch CryptoOrder Success',props<{ CryptoOrder: OrdersModel[] }>());
export const fetchCryptoOrderFailure = createAction('[Data] Fetch CryptoOrder Failure', props<{ error: string }>());

// Transaction
export const fetchCryptoTransactionData = createAction('[Data] Fetch CryptoTransaction');
export const fetchCryptoTransactionSuccess = createAction('[Data] Fetch CryptoTransaction Success',props<{ Transaction: TransactionsModel[] }>());
export const fetchCryptoTransactionFailure = createAction('[Data] Fetch CryptoTransaction Failure', props<{ error: string }>());
