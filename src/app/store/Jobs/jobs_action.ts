import { createAction, props } from '@ngrx/store';
import { ApplicationModel } from './jobs_model';

// Application
export const fetchApplicationData = createAction('[Data] Fetch Application');
export const fetchApplicationSuccess = createAction('[Data] Fetch Application Success',props<{ Application: ApplicationModel[] }>());
export const fetchApplicationFailure = createAction('[Data] Fetch Application Failure', props<{ error: string }>());

// Add Application Data
export const addApplication = createAction(
    '[Data] Add Application',
    props<{ newData: ApplicationModel }>()
);
export const addApplicationSuccess = createAction(
    '[Data] Add Application Success',
    props<{ newData: ApplicationModel }>()
);
export const addApplicationFailure = createAction(
    '[Data] Add Application Failure',
    props<{ error: string }>()
);

// Update Application Data
export const updateApplication = createAction(
    '[Data] Update Application',
    props<{ updatedData: ApplicationModel }>()
);
export const updateApplicationSuccess = createAction(
    '[Data] Update Application Success',
    props<{ updatedData: ApplicationModel }>()
);
export const updateApplicationFailure = createAction(
    '[Data] Update Application Failure',
    props<{ error: string }>()
);

// Delete Application Data
export const deleteApplication = createAction(
    '[Data] Delete Application',
    props<{ id: string }>()
);
export const deleteApplicationSuccess = createAction(
    '[Data] Delete Application Success',
    props<{ id: string }>()
);
export const deleteApplicationFailure = createAction(
    '[Data] Delete Application Failure',
    props<{ error: string }>()
);

