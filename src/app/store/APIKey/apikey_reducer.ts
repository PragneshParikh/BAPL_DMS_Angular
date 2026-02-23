import { Action, createReducer, on } from '@ngrx/store';
import { addApikeySuccess, deleteApikeySuccess, fetchApikeyData, fetchApikeyFailure, fetchApikeySuccess, updateApikeySuccess } from './apikey_action';

export interface ApikeyState {
    Apikey: any[];
    loading: boolean;
    error: any;
}

export const initialState: ApikeyState = {
    Apikey: [],
    loading: false,
    error: null,
};

export const ApikeyReducer = createReducer(
    initialState,
    // Contact
    on(fetchApikeyData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchApikeySuccess, (state, { Apikey }) => {
        return { ...state, Apikey, loading: false };
    }),
    on(fetchApikeyFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addApikeySuccess, (state, { newData }) => {
        return { ...state, Apikey: [newData, ...state.Apikey], error: null };
    }),

    on(updateApikeySuccess, (state, { updatedData }) => {
        return {
            ...state, Apikey: state.Apikey.map((Apikeys) => Apikeys.id === updatedData.id ? updatedData : Apikeys), error: null
        };
    }),

    on(deleteApikeySuccess, (state, { id }) => {
        const updatedApikey = state.Apikey.filter((Apikey) => !id.includes(Apikey.id));
        return { ...state, Apikey: updatedApikey, error: null };
    }),

);

// Selector
export function reducer(state: ApikeyState | undefined, action: Action) {
    return ApikeyReducer(state, action);
}
