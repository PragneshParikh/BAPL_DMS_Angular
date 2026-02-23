import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TodoState } from './todo_reducer';

export const selectTodoState = createFeatureSelector<TodoState>('Todo');

export const selectTodoData = createSelector(
    selectTodoState,
    (state: TodoState) => state.Todo
);

export const selectTodoLoading = createSelector(
    selectTodoState,
    (state: TodoState) => state.loading
);

export const selectTodoError = createSelector(
    selectTodoState,
    (state: TodoState) => state.error
);

