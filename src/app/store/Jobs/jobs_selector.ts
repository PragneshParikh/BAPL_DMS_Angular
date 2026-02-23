import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApplicationState } from './jobs_reducer';

export const selectDataState = createFeatureSelector<ApplicationState>('Jobs');

export const selectJobsData = createSelector(
    selectDataState,
    (state: ApplicationState) => state.Application
);

export const selectJobsLoading = createSelector(
    selectDataState,
    (state: ApplicationState) => state.loading
);

export const selectJobsError = createSelector(
    selectDataState,
    (state: ApplicationState) => state.error
);

