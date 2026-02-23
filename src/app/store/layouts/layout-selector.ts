import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LayoutState } from './layout-reducers';

export const getLayoutState = createFeatureSelector<LayoutState>('layout');

export const getLayoutTheme = createSelector(
    getLayoutState,
    (state: LayoutState) => state.LAYOUT
);

export const getTheme = createSelector(
    getLayoutState,
    (state: LayoutState) => state.LAYOUT_THEME
);

export const getThemeColor = createSelector(
    getLayoutState,
    (state: LayoutState) => state.LAYOUT_THEME_COLOR
);

export const getLayoutMode = createSelector(
    getLayoutState,
    (state: LayoutState) => state.LAYOUT_MODE
);

export const getLayoutWith = createSelector(
    getLayoutState,
    (state: LayoutState) => state.LAYOUT_WIDTH
);

export const getLayoutPosition = createSelector(
    getLayoutState,
    (state: LayoutState) => state.LAYOUT_POSITION
);

export const getTopbarColor = createSelector(
    getLayoutState,
    (state: LayoutState) => state.TOPBAR
);

export const getSidebarSize = createSelector(
    getLayoutState,
    (state: LayoutState) => state.SIDEBAR_SIZE
);

export const getSidebarColor = createSelector(
    getLayoutState,
    (state: LayoutState) => state.SIDEBAR_COLOR
);

export const getSidebarView = createSelector(
    getLayoutState,
    (state: LayoutState) => state.SIDEBAR_VIEW
);

export const getSidebarImage = createSelector(
    getLayoutState,
    (state: LayoutState) => state.SIDEBAR_IMAGE
);
export const getBackgroundImage = createSelector(
    getLayoutState,
    (state: LayoutState) => state.BACKGROUND_IMAGE
);

export const getSidebarVisibilitye = createSelector(
    getLayoutState,
    (state: LayoutState) => state.SIDEBAR_VISIBILITY
);

export const getPreloader = createSelector(
    getLayoutState,
    (state: LayoutState) => state.DATA_PRELOADER
);
