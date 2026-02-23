import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FileManagerState } from './filemanager_reducer';

export const selectDataState = createFeatureSelector<FileManagerState>('FileManager');

export const selectFolderData = createSelector(
    selectDataState,
    (state: FileManagerState) => state.Folder
);

export const selectFileData = createSelector(
    selectDataState,
    (state: FileManagerState) => state.File
);

export const selectFileLoading = createSelector(
    selectDataState,
    (state: FileManagerState) => state.loading
);

export const selectFileError = createSelector(
    selectDataState,
    (state: FileManagerState) => state.error
);

