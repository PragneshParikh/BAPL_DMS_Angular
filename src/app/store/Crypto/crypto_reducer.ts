import { Action, createReducer, on } from '@ngrx/store';
import { fetchCryptoOrderData, fetchCryptoOrderFailure, fetchCryptoOrderSuccess, fetchCryptoTransactionData, fetchCryptoTransactionFailure, fetchCryptoTransactionSuccess } from './crypto_action';

export interface CryptoState {
    CryptoOrder: any[];
    Transaction: any[];
    loading: boolean;
    error: any;
}

export const initialState: CryptoState = {
    CryptoOrder: [],
    Transaction: [],
    loading: false,
    error: null,
};

export const CryptoReducer = createReducer(
    initialState,
    // Contact
    on(fetchCryptoOrderData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchCryptoOrderSuccess, (state, { CryptoOrder }) => {
        return { ...state, CryptoOrder, loading: false };
    }),
    on(fetchCryptoOrderFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    // Transaction
    on(fetchCryptoTransactionData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchCryptoTransactionSuccess, (state, { Transaction }) => {
        return { ...state, Transaction, loading: false };
    }),
    on(fetchCryptoTransactionFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    })
  

);

// Selector
export function reducer(state: CryptoState | undefined, action: Action) {
    return CryptoReducer(state, action);
}
