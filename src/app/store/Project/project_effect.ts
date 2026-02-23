import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { fetchProjectListData, fetchProjectListFailure, fetchProjectListSuccess } from "./project_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class ProjectEffects {
private actions$ = inject(Actions);
    // Project
    fetchProjectData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchProjectListData),
            mergeMap(() =>
                this.restApiService.getProjectData().pipe(
                    map((Project) => {
                        // const Project = JSON.parse(Project).data;
                        return fetchProjectListSuccess({ Project })
                    }),
                    catchError((error) =>
                        of(fetchProjectListFailure({ error }))
                    )
                )
            ),
        ),
    );

    // deleteProjectData$ = createEffect(() =>
    //     this.actions$.pipe(
    //         ofType(deleteProject),
    //         mergeMap(({ id }) =>
    //             this.restApiService.deleteData(id).pipe(
    //                 map(() => deleteProjectSuccess({ id })),
    //                 catchError((error) => of(deleteProjectFailure({ error })))
    //             )
    //         )
    //     )
    // );


    constructor(
        private restApiService: restApiService
    ) { }
}