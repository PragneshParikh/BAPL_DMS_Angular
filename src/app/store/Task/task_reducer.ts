import { Action, createReducer, on } from '@ngrx/store';
import { addTaskSuccess, deleteTaskSuccess, fetchKanbanListData, fetchKanbanListFailure, fetchKanbanListSuccess, fetchTaskListData, fetchTaskListFailure, fetchTaskListSuccess, updateTaskSuccess } from './task_action';

export interface TaskState {
  Task: any[];
  Kanban: any[];
  loading: boolean;
  error: any;
}

export const initialState: TaskState = {
  Task: [],
  Kanban: [],
  loading: false,
  error: null,
};

export const TaskReducer = createReducer(
  initialState,
  on(fetchTaskListData, (state) => {
    return { ...state, loading: true, error: null };
  }),
  on(fetchTaskListSuccess, (state, { Task }) => {
    return { ...state, Task, loading: false };
  }),
  on(fetchTaskListFailure, (state, { error }) => {
    return { ...state, error, loading: false };
  }),

  on(addTaskSuccess, (state, { newData }) => {
    return { ...state, Task: [newData, ...state.Task], error: null };
  }),

  on(updateTaskSuccess, (state, { updatedData }) => {
    return {
      ...state, Task: state.Task.map((Tasks) => Tasks.taskId === updatedData.taskId ? updatedData : Tasks), error: null
    };
  }),

  on(deleteTaskSuccess, (state, { id }) => {
    const updatedTask = state.Task.filter((Task) => {
      return !id.includes(Task._id)
    });
    return { ...state, Task: updatedTask, error: null };
  }),

  // Kanban
  on(fetchKanbanListData, (state) => {
    return { ...state, loading: true, error: null };
  }),
  on(fetchKanbanListSuccess, (state, { Kanban }) => {
    return { ...state, Kanban, loading: false };
  }),
  on(fetchKanbanListFailure, (state, { error }) => {
    return { ...state, error, loading: false };
  }),

);

// Selector
export function reducer(state: TaskState | undefined, action: Action) {
  return TaskReducer(state, action);
}
