import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProjectState } from './project_reducer';

export const selectprojectState = createFeatureSelector<ProjectState>('Project');

export const selectProjectData = createSelector(
    selectprojectState,
    (state: ProjectState) => state.Project
);

export const selectprojectLoading = createSelector(
    selectprojectState,
    (state: ProjectState) => state.loading
);

export const selectprojectError = createSelector(
    selectprojectState,
    (state: ProjectState) => state.error
);

