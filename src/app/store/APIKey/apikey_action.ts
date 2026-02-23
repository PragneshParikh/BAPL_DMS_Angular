import { createAction, props } from '@ngrx/store';
import { ApikeyModel } from './apikey_model';

// Apikey
export const fetchApikeyData = createAction('[Data] Fetch Apikey');
export const fetchApikeySuccess = createAction('[Data] Fetch Apikey Success',props<{ Apikey: ApikeyModel[] }>());
export const fetchApikeyFailure = createAction('[Data] Fetch Apikey Failure', props<{ error: string }>());

// Add Apikey Data
export const addApikey = createAction(
    '[Data] Add Apikey',
    props<{ newData: ApikeyModel }>()
);
export const addApikeySuccess = createAction(
    '[Data] Add Apikey Success',
    props<{ newData: ApikeyModel }>()
);
export const addApikeyFailure = createAction(
    '[Data] Add Apikey Failure',
    props<{ error: string }>()
);

// Update Apikey Data
export const updateApikey = createAction(
    '[Data] Update Apikey',
    props<{ updatedData: ApikeyModel }>()
);
export const updateApikeySuccess = createAction(
    '[Data] Update Apikey Success',
    props<{ updatedData: ApikeyModel }>()
);
export const updateApikeyFailure = createAction(
    '[Data] Update Apikey Failure',
    props<{ error: string }>()
);

// Delete Apikey Data
export const deleteApikey = createAction(
    '[Data] Delete Apikey',
    props<{ id: string }>()
);
export const deleteApikeySuccess = createAction(
    '[Data] Delete Apikey Success',
    props<{ id: string }>()
);
export const deleteApikeyFailure = createAction(
    '[Data] Delete Apikey Failure',
    props<{ error: string }>()
);

