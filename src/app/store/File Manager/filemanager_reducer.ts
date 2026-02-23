import { Action, createReducer, on } from '@ngrx/store';
import { addFileSuccess, addFolderSuccess, deleteFileSuccess, deleteFolderSuccess, fetchFileData, fetchFileFailure, fetchFileSuccess, fetchFolderData, fetchFolderFailure, fetchFolderSuccess, updateFileSuccess, updateFolderSuccess } from './filemanager_action';

export interface FileManagerState {
    Folder: any[];
    File: any[];
    loading: boolean;
    error: any;
}

export const initialState: FileManagerState = {
    Folder: [],
    File: [],
    loading: false,
    error: null,
};

export const FileManagerReducer = createReducer(
    initialState,
    // Folder
    on(fetchFolderData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchFolderSuccess, (state, { Folder }) => {
        return { ...state, Folder, loading: false };
    }),
    on(fetchFolderFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addFolderSuccess, (state, { newData }) => {
        return { ...state, Folder: [newData, ...state.Folder], error: null };
    }),

    on(updateFolderSuccess, (state, { updatedData }) => {
        return {
            ...state, Folder: state.Folder.map((Folders) => Folders.id === updatedData.id ? updatedData : Folders), error: null
        };
    }),

    on(deleteFolderSuccess, (state, { id }) => {
        const updatedFolder = state.Folder.filter((Folder) => !id.includes(Folder.id));
        return { ...state, Folder: updatedFolder, error: null };
    }),

  
    // File
    on(fetchFileData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchFileSuccess, (state, { File }) => {
        return { ...state, File, loading: false };
    }),
    on(fetchFileFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addFileSuccess, (state, { newData }) => {
        return { ...state, File: [newData, ...state.File], error: null };
    }),

    on(updateFileSuccess, (state, { updatedData }) => {
        return {
            ...state, File: state.File.map((Files) => Files.id === updatedData.id ? updatedData : Files), error: null
        };
    }),

    on(deleteFileSuccess, (state, { id }) => {
        const updatedFile = state.File.filter((File) => !id.includes(File.id));
        return { ...state, File: updatedFile, error: null };
    }),

);

// Selector
export function reducer(state: FileManagerState | undefined, action: Action) {
    return FileManagerReducer(state, action);
}
