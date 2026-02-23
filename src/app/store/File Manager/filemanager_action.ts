import { createAction, props } from '@ngrx/store';
import { FileModel, FolderModel } from './filemanager_model';

// Folder
export const fetchFolderData = createAction('[Data] Fetch Folder');
export const fetchFolderSuccess = createAction('[Data] Fetch Folder Success',props<{ Folder: FolderModel[] }>());
export const fetchFolderFailure = createAction('[Data] Fetch Folder Failure', props<{ error: string }>());

// File
export const fetchFileData = createAction('[Data] Fetch File');
export const fetchFileSuccess = createAction('[Data] Fetch File Success',props<{ File: FileModel[] }>());
export const fetchFileFailure = createAction('[Data] Fetch File Failure', props<{ error: string }>());

// Add Folder Data
export const addFolder = createAction(
    '[Data] Add Folder',
    props<{ newData: FolderModel }>()
);
export const addFolderSuccess = createAction(
    '[Data] Add Folder Success',
    props<{ newData: FolderModel }>()
);
export const addFolderFailure = createAction(
    '[Data] Add Folder Failure',
    props<{ error: string }>()
);

// Update Folder Data
export const updateFolder = createAction(
    '[Data] Update Folder',
    props<{ updatedData: FolderModel }>()
);
export const updateFolderSuccess = createAction(
    '[Data] Update Folder Success',
    props<{ updatedData: FolderModel }>()
);
export const updateFolderFailure = createAction(
    '[Data] Update Folder Failure',
    props<{ error: string }>()
);

// Delete Folder Data
export const deleteFolder = createAction(
    '[Data] Delete Folder',
    props<{ id: string }>()
);
export const deleteFolderSuccess = createAction(
    '[Data] Delete Folder Success',
    props<{ id: string }>()
);
export const deleteFolderFailure = createAction(
    '[Data] Delete Folder Failure',
    props<{ error: string }>()
);

// Add File Data
export const addFile = createAction(
    '[Data] Add File',
    props<{ newData: FileModel }>()
);
export const addFileSuccess = createAction(
    '[Data] Add File Success',
    props<{ newData: FileModel }>()
);
export const addFileFailure = createAction(
    '[Data] Add File Failure',
    props<{ error: string }>()
);

// Update File Data
export const updateFile = createAction(
    '[Data] Update File',
    props<{ updatedData: FileModel }>()
);
export const updateFileSuccess = createAction(
    '[Data] Update File Success',
    props<{ updatedData: FileModel }>()
);
export const updateFileFailure = createAction(
    '[Data] Update File Failure',
    props<{ error: string }>()
);

// Delete File Data
export const deleteFile = createAction(
    '[Data] Delete File',
    props<{ id: string }>()
);
export const deleteFileSuccess = createAction(
    '[Data] Delete File Success',
    props<{ id: string }>()
);
export const deleteFileFailure = createAction(
    '[Data] Delete File Failure',
    props<{ error: string }>()
);

