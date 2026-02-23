import { Action, createReducer, on } from '@ngrx/store';
import { addTicketSuccess, deleteTicketSuccess, fetchTicketListData, fetchTicketListFailure, fetchTicketListSuccess, updateTicketSuccess } from './ticket_action';

export interface TicketState {
    Ticket: any[];
    loading: boolean;
    error: any;
}

export const initialState: TicketState = {
    Ticket: [],
    loading: false,
    error: null,
};

export const TicketReducer = createReducer(
    initialState,
    // Contact
    on(fetchTicketListData, (state) => {
        return { ...state, loading: true, error: null };
    }),
    on(fetchTicketListSuccess, (state, { Ticket }) => {
        return { ...state, Ticket, loading: false };
    }),
    on(fetchTicketListFailure, (state, { error }) => {
        return { ...state, error, loading: false };
    }),

    on(addTicketSuccess, (state, { newData }) => {
        return { ...state, Ticket: [newData, ...state.Ticket], error: null };
    }),

    on(updateTicketSuccess, (state, { updatedData }) => {
        return {
            ...state, Ticket: state.Ticket.map((Tickets) => Tickets.id === updatedData.id ? updatedData : Tickets), error: null
        };
    }),

    on(deleteTicketSuccess, (state, { id }) => {
        const updatedTicket = state.Ticket.filter((Ticket) => !id.includes(Ticket._id));
        return { ...state, Ticket: updatedTicket, error: null };
    }),

);

// Selector
export function reducer(state: TicketState | undefined, action: Action) {
    return TicketReducer(state, action);
}
