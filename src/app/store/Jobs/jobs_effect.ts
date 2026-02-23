import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { addApplication, addApplicationFailure, addApplicationSuccess, deleteApplication, deleteApplicationFailure, deleteApplicationSuccess,   fetchApplicationData,   fetchApplicationFailure,   fetchApplicationSuccess,   updateApplication, updateApplicationSuccess } from "./jobs_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class ApplicationEffects {
    private actions$ = inject(Actions);
    fetchApplicationList$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchApplicationData),
            mergeMap(() =>
                this.restApiService.getApplicationData().pipe(
                    map((Application) => {
                        return fetchApplicationSuccess({ Application })
                    }),
                    catchError((error) =>
                        of(fetchApplicationFailure({ error }))
                    )
                )
            ),
        ),
    );

    addApplicationData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addApplication),
            mergeMap(({ newData }) =>
                this.restApiService.addApplicationData(newData).pipe(
                    map(() => addApplicationSuccess({ newData})),
                    catchError((error) => of(addApplicationFailure({ error })))
                )
            )
        )
    )

    updateApplicationData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateApplication),
            mergeMap(({ updatedData }) =>
                this.restApiService.updateApplicationData(updatedData).pipe(
                    map(() => updateApplicationSuccess({ updatedData })),
                    catchError((error) => of(addApplicationFailure({ error })))
                )
            )
        )
    );

    deleteApplication$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteApplication),
            mergeMap(({ id }) =>
                this.restApiService.deleteApplicationData().pipe(
                    map(() => deleteApplicationSuccess({ id })),
                    catchError((error) => of(deleteApplicationFailure({ error })))
                )
            )
        )
    );

    constructor(
        private restApiService: restApiService
    ) { }
}