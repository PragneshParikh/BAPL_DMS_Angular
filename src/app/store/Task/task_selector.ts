import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskState } from './task_reducer';

export const selectTaskState = createFeatureSelector<TaskState>('Task');

export const selectTaskData = createSelector(
    selectTaskState,
    (state: TaskState) => state.Task
);

export const selectKanbanData = createSelector(
    selectTaskState,
    (state: TaskState) => state.Kanban
);

export const selectTaskLoading = createSelector(
    selectTaskState,
    (state: TaskState) => state.loading
);

export const selectTaskError = createSelector(
    selectTaskState,
    (state: TaskState) => state.error
);

