import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TicketState } from './ticket_reducer';

export const selectDataState = createFeatureSelector<TicketState>('Ticket');

export const selectTicketData = createSelector(
    selectDataState,
    (state: TicketState) => state.Ticket
);

export const selectTicketLoading = createSelector(
    selectDataState,
    (state: TicketState) => state.loading
);

export const selectTicketError = createSelector(
    selectDataState,
    (state: TicketState) => state.error
);

