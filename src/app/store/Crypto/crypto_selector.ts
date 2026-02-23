import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CryptoState } from './crypto_reducer';

export const selectCryptoState = createFeatureSelector<CryptoState>('Crypto');

export const selectCryptoOrderData = createSelector(
    selectCryptoState,
    (state: CryptoState) => state.CryptoOrder
);

export const selectTransacrionData = createSelector(
    selectCryptoState,
    (state: CryptoState) => state.Transaction
);

export const selectCryptoLoading = createSelector(
    selectCryptoState,
    (state: CryptoState) => state.loading
);

export const selectCryptoError = createSelector(
    selectCryptoState,
    (state: CryptoState) => state.error
);

