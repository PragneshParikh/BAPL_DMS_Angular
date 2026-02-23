import { createAction, props } from '@ngrx/store';
import { TicketListModel } from './ticket_model';

// Product
export const fetchTicketListData = createAction('[Data] Fetch TicketList');
export const fetchTicketListSuccess = createAction('[Data] Fetch TicketList Success',props<{ Ticket: TicketListModel[] }>());
export const fetchTicketListFailure = createAction('[Data] Fetch TicketList Failure', props<{ error: string }>());

// Add Ticket Data
export const addTicket = createAction(
    '[Data] Add Ticket',
    props<{ newData: TicketListModel }>()
);
export const addTicketSuccess = createAction(
    '[Data] Add Ticket Success',
    props<{ newData: TicketListModel }>()
);
export const addTicketFailure = createAction(
    '[Data] Add Ticket Failure',
    props<{ error: string }>()
);

// Update Ticket Data
export const updateTicket = createAction(
    '[Data] Update Ticket',
    props<{ updatedData: TicketListModel }>()
);
export const updateTicketSuccess = createAction(
    '[Data] Update Ticket Success',
    props<{ updatedData: TicketListModel }>()
);
export const updateTicketFailure = createAction(
    '[Data] Update Ticket Failure',
    props<{ error: string }>()
);

// Delete Ticket Data
export const deleteTicket = createAction(
    '[Data] Delete Ticket',
    props<{ id: string }>()
);
export const deleteTicketSuccess = createAction(
    '[Data] Delete Ticket Success',
    props<{ id: string }>()
);
export const deleteTicketFailure = createAction(
    '[Data] Delete Ticket Failure',
    props<{ error: string }>()
);