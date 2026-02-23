import { createAction, props } from '@ngrx/store';
import { TodoModel } from './todo_model';

// Product
export const fetchTodoListData = createAction('[Data] Fetch TodoList');
export const fetchTodoListSuccess = createAction('[Data] Fetch TodoList Success',props<{ Todo: TodoModel[] }>());
export const fetchTodoListFailure = createAction('[Data] Fetch TodoList Failure', props<{ error: string }>());

// Add Todo Data
export const addTodo = createAction(
    '[Data] Add Todo',
    props<{ newData: TodoModel }>()
);
export const addTodoSuccess = createAction(
    '[Data] Add Todo Success',
    props<{ newData: TodoModel }>()
);
export const addTodoFailure = createAction(
    '[Data] Add Todo Failure',
    props<{ error: string }>()
);

// Update Todo Data
export const updateTodo = createAction(
    '[Data] Update Todo',
    props<{ updatedData: TodoModel }>()
);
export const updateTodoSuccess = createAction(
    '[Data] Update Todo Success',
    props<{ updatedData: TodoModel }>()
);
export const updateTodoFailure = createAction(
    '[Data] Update Todo Failure',
    props<{ error: string }>()
);

// Delete Todo Data
export const deleteTodo = createAction(
    '[Data] Delete Todo',
    props<{ id: string }>()
);
export const deleteTodoSuccess = createAction(
    '[Data] Delete Todo Success',
    props<{ id: string }>()
);
export const deleteTodoFailure = createAction(
    '[Data] Delete Todo Failure',
    props<{ error: string }>()
);