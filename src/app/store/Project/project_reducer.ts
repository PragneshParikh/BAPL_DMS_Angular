import { Action, createReducer, on } from '@ngrx/store';
import { fetchProjectListData, fetchProjectListFailure, fetchProjectListSuccess } from './project_action';

export interface ProjectState {
    Project: any[];
    loading: boolean;
    error: any;
}

export const initialState: ProjectState = {
    Project: [],
    loading: false,
    error: null,
};

export const ProjectReducer = createReducer(
    initialState,
    on(fetchProjectListData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchProjectListSuccess, (state, { Project }) => {
        return { ...state, Project, loading: false };
    }),
    on(fetchProjectListFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

);

// Selector
export function reducer(state: ProjectState | undefined, action: Action) {
    return ProjectReducer(state, action);
}
