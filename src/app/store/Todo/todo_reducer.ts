import { Action, createReducer, on } from '@ngrx/store';
import { addTodoSuccess, deleteTodoSuccess, fetchTodoListData, fetchTodoListFailure, fetchTodoListSuccess, updateTodoSuccess } from './todo_action';

export interface TodoState {
  Todo: any[];
  loading: boolean;
  error: any;
}

export const initialState: TodoState = {
  Todo: [],
  loading: false,
  error: null,
};

export const TodoReducer = createReducer(
  initialState,
  on(fetchTodoListData, (state) => {
    return { ...state, loading: true, error: null };
  }),
  on(fetchTodoListSuccess, (state, { Todo }) => {
    return { ...state, Todo, loading: false };
  }),
  on(fetchTodoListFailure, (state, { error }) => {
    return { ...state, error, loading: false };
  }),

  on(addTodoSuccess, (state, { newData }) => {
    return { ...state, Todo: [newData, ...state.Todo], error: null };
  }),

    on(updateTodoSuccess, (state, { updatedData }) => {
    return {
      ...state, Todo: state.Todo.map((Todos) => Todos._id === updatedData._id ? updatedData : Todos), error: null
    };
  }),

  on(deleteTodoSuccess, (state, { id }) => {
    const updatedTodo = state.Todo.filter((Todo) => !id.includes(Todo._id));
    return { ...state, Todo: updatedTodo, error: null };
  }),

);

// Selector
export function reducer(state: TodoState | undefined, action: Action) {
  return TodoReducer(state, action);
}
