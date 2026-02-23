import { createAction, props } from '@ngrx/store';
import { KanbanModel, TaskListModel } from './task_model';

// TaskList
export const fetchTaskListData = createAction('[Data] Fetch TaskList');
export const fetchTaskListSuccess = createAction('[Data] Fetch TaskList Success',props<{ Task: TaskListModel[] }>());
export const fetchTaskListFailure = createAction('[Data] Fetch TaskList Failure', props<{ error: string }>());

// Kanban
export const fetchKanbanListData = createAction('[Data] Fetch KanbanList');
export const fetchKanbanListSuccess = createAction('[Data] Fetch KanbanList Success',props<{ Kanban: KanbanModel[] }>());
export const fetchKanbanListFailure = createAction('[Data] Fetch KanbanList Failure', props<{ error: string }>());

// Add Task Data
export const addTask = createAction(
    '[Data] Add Task',
    props<{ newData: TaskListModel }>()
);
export const addTaskSuccess = createAction(
    '[Data] Add Task Success',
    props<{ newData: TaskListModel }>()
);
export const addTaskFailure = createAction(
    '[Data] Add Task Failure',
    props<{ error: string }>()
);

// Update Task Data
export const updateTask = createAction(
    '[Data] Update Task',
    props<{ updatedData: TaskListModel }>()
);
export const updateTaskSuccess = createAction(
    '[Data] Update Task Success',
    props<{ updatedData: TaskListModel }>()
);
export const updateTaskFailure = createAction(
    '[Data] Update Task Failure',
    props<{ error: string }>()
);


// Delete Task Data
export const deleteTask = createAction(
    '[Data] Delete Task',
    props<{ id: string }>()
);
export const deleteTaskSuccess = createAction(
    '[Data] Delete Task Success',
    props<{ id: string }>()
);
export const deleteTaskFailure = createAction(
    '[Data] Delete Task Failure',
    props<{ error: string }>()
);
