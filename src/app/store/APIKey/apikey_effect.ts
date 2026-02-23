import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { addApikey, addApikeyFailure, addApikeySuccess, deleteApikey, deleteApikeyFailure, deleteApikeySuccess,   fetchApikeyData,   fetchApikeyFailure,   fetchApikeySuccess,   updateApikey, updateApikeySuccess } from "./apikey_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class ApikeyEffects {
    private actions$ = inject(Actions);
    fetchApikeyList$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchApikeyData),
            mergeMap(() =>
                this.restApiService.getApikeyData().pipe(
                    map((Apikey) => {
                        return fetchApikeySuccess({ Apikey })
                    }),
                    catchError((error) =>
                        of(fetchApikeyFailure({ error }))
                    )
                )
            ),
        ),
    );

    addApikeyData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addApikey),
            mergeMap(({ newData }) =>
                this.restApiService.addApikeyData(newData).pipe(
                    map(() => addApikeySuccess({ newData})),
                    catchError((error) => of(addApikeyFailure({ error })))
                )
            )
        )
    )

    updateApikeyData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateApikey),
            mergeMap(({ updatedData }) =>
                this.restApiService.updateApikeyData(updatedData).pipe(
                    map(() => updateApikeySuccess({ updatedData })),
                    catchError((error) => of(addApikeyFailure({ error })))
                )
            )
        )
    );

    deleteApikey$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteApikey),
            mergeMap(({ id }) =>
                this.restApiService.deleteApikeyData().pipe(
                    map(() => deleteApikeySuccess({ id })),
                    catchError((error) => of(deleteApikeyFailure({ error })))
                )
            )
        )
    );

    constructor(
        private restApiService: restApiService
    ) { }
}