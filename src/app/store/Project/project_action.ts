import { createAction, props } from '@ngrx/store';
import { projectListModel } from './project_model';

// Product
export const fetchProjectListData = createAction('[Data] Fetch ProjectList');
export const fetchProjectListSuccess = createAction('[Data] Fetch ProjectList Success',props<{ Project: projectListModel[] }>());
export const fetchProjectListFailure = createAction('[Data] Fetch ProjectList Failure', props<{ error: string }>());