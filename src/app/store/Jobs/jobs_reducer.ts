import { Action, createReducer, on } from '@ngrx/store';
import { addApplicationSuccess, deleteApplicationSuccess, fetchApplicationData, fetchApplicationFailure, fetchApplicationSuccess, updateApplicationSuccess } from './jobs_action';

export interface ApplicationState {
    Application: any[];
    loading: boolean;
    error: any;
}

export const initialState: ApplicationState = {
    Application: [],
    loading: false,
    error: null,
};

export const ApplicationReducer = createReducer(
    initialState,
    // Contact
    on(fetchApplicationData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchApplicationSuccess, (state, { Application }) => {
        return { ...state, Application, loading: false };
    }),
    on(fetchApplicationFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addApplicationSuccess, (state, { newData }) => {
        return { ...state, Application: [newData, ...state.Application], error: null };
    }),

    on(updateApplicationSuccess, (state, { updatedData }) => {
        return {
            ...state, Application: state.Application.map((Applications) => Applications.id === updatedData.id ? updatedData : Applications), error: null
        };
    }),

    on(deleteApplicationSuccess, (state, { id }) => {
        const updatedApplication = state.Application.filter((Application) => !id.includes(Application.id));
        return { ...state, Application: updatedApplication, error: null };
    }),

);

// Selector
export function reducer(state: ApplicationState | undefined, action: Action) {
    return ApplicationReducer(state, action);
}
