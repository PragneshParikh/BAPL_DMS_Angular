import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { addFile, addFileFailure, addFileSuccess, addFolder, addFolderFailure, addFolderSuccess, deleteFile, deleteFileFailure, deleteFileSuccess, deleteFolder, deleteFolderFailure, deleteFolderSuccess, fetchFileData, fetchFileFailure, fetchFileSuccess, fetchFolderData, fetchFolderFailure, fetchFolderSuccess, updateFile, updateFileFailure, updateFileSuccess, updateFolder, updateFolderFailure, updateFolderSuccess } from "./filemanager_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class FileManagerEffects {
    private actions$ = inject(Actions);
    fetchFolders$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchFolderData),
            mergeMap(() =>
                this.restApiService.getFolderData().pipe(
                    map((Folder) => {
                        return fetchFolderSuccess({ Folder })
                    }),
                    catchError((error) =>
                        of(fetchFolderFailure({ error }))
                    )
                )
            ),
        ),
    );

    addFolderData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addFolder),
            mergeMap(({ newData }) =>
                this.restApiService.addFolderData(newData).pipe(
                    map(() => addFolderSuccess({ newData })),
                    catchError((error) => of(addFolderFailure({ error })))
                )
            )
        )
    );

    updateFolderData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateFolder),
            mergeMap(({ updatedData }) =>
                this.restApiService.updateFolderData(updatedData).pipe(
                    map(() => updateFolderSuccess({ updatedData })),
                    catchError((error) => of(updateFolderFailure({ error })))
                )
            )
        )
    );

    deleteFolderData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteFolder),
            mergeMap(({ id }) =>
                this.restApiService.deleteFolderData().pipe(
                    map(() => deleteFolderSuccess({ id })),
                    catchError((error) => of(deleteFolderFailure({ error })))
                )
            )
        )
    );

    // File
    fetchFiles$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchFileData),
            mergeMap(() =>
                this.restApiService.getFileData().pipe(
                    map((File) => {
                        return fetchFileSuccess({ File })
                    }),
                    catchError((error) =>
                        of(fetchFileFailure({ error }))
                    )
                )
            ),
        ),
    );

    addFileData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addFile),
            mergeMap(({ newData }) =>
                this.restApiService.addFileData(newData).pipe(
                    map(() => addFileSuccess({ newData })),
                    catchError((error) => of(addFileFailure({ error })))
                )
            )
        )
    );

    updateFileData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateFile),
            mergeMap(({ updatedData }) =>
                this.restApiService.updateFileData(updatedData).pipe(
                    map(() => updateFileSuccess({ updatedData })),
                    catchError((error) => of(updateFileFailure({ error })))
                )
            )
        )
    );

    deleteFileData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteFile),
            mergeMap(({ id }) =>
                this.restApiService.deleteFileData().pipe(
                    map(() => deleteFileSuccess({ id })),
                    catchError((error) => of(deleteFileFailure({ error })))
                )
            )
        )
    );



    constructor(
        private restApiService: restApiService
    ) { }
}