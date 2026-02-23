import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { addTask, addTaskFailure, addTaskSuccess, deleteTask, deleteTaskFailure, deleteTaskSuccess, fetchKanbanListData, fetchKanbanListFailure, fetchKanbanListSuccess, fetchTaskListData, fetchTaskListFailure, fetchTaskListSuccess, updateTask, updateTaskFailure, updateTaskSuccess } from "./task_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class TaskEffects {
private actions$ = inject(Actions);
    // Task
    fetchTaskData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchTaskListData),
            mergeMap(() =>
                this.restApiService.getTaskData().pipe(
                    map((tasks) => {
                        const Task = JSON.parse(tasks).data;
                        return fetchTaskListSuccess({ Task })
                    }),
                    catchError((error) =>
                        of(fetchTaskListFailure({ error }))
                    )
                )
            ),
        ),
    );

    addTaskData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addTask),
            mergeMap(({ newData }) =>
                this.restApiService.postTaskData(newData).pipe(
                    map((responseData) => addTaskSuccess({ newData: responseData.data })),
                    catchError((error) => of(addTaskFailure({ error })))
                )
            )
        )
    )

    updateTaskData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateTask),
            mergeMap(({ updatedData }) =>
                this.restApiService.patchTaskData(updatedData).pipe(
                    map((responseData) => updateTaskSuccess({ updatedData: responseData.data })),
                    catchError((error) => of(updateTaskFailure({ error })))
                )
            )
        )
    );


    deleteTaskData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteTask),
            mergeMap(({ id }) =>
                this.restApiService.deleteTask(id).pipe(
                    map(() => deleteTaskSuccess({ id })),
                    catchError((error) => of(deleteTaskFailure({ error })))
                )
            )
        )
    );

    // Kanban
    fetchKanbanData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchKanbanListData),
            mergeMap(() =>
                this.restApiService.getKanbanData().pipe(
                    map((Kanban) => {
                        return fetchKanbanListSuccess({ Kanban })
                    }),
                    catchError((error) =>
                        of(fetchKanbanListFailure({ error }))
                    )
                )
            ),
        ),
    );

    constructor(
        private restApiService: restApiService
    ) { }
}