import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApikeyState } from './apikey_reducer';

export const selectDataState = createFeatureSelector<ApikeyState>('APIKey');

export const selectApikeyData = createSelector(
    selectDataState,
    (state: ApikeyState) => state.Apikey
);

export const selectApikeyLoading = createSelector(
    selectDataState,
    (state: ApikeyState) => state.loading
);

export const selectApikeyError = createSelector(
    selectDataState,
    (state: ApikeyState) => state.error
);

