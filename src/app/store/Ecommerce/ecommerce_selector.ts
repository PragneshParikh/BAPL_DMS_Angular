import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EcommerceState } from './ecommerce_reducer';

export const selectDataState = createFeatureSelector<EcommerceState>('Ecommerce');

export const selectProductData = createSelector(
    selectDataState,
    (state: EcommerceState) => state.Product
);

export const selectOrderData = createSelector(
    selectDataState,
    (state: EcommerceState) => state.order
);

export const selectCustomerData = createSelector(
    selectDataState,
    (state: EcommerceState) => state.Customer
);

export const selectSellerData = createSelector(
    selectDataState,
    (state: EcommerceState) => state.Seller
);

export const selectDataLoading = createSelector(
    selectDataState,
    (state: EcommerceState) => state.loading
);

export const selectDataError = createSelector(
    selectDataState,
    (state: EcommerceState) => state.error
);

