import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { addTicket, addTicketFailure, addTicketSuccess, deleteTicket, deleteTicketFailure, deleteTicketSuccess, fetchTicketListData, fetchTicketListFailure, fetchTicketListSuccess, updateTicket, updateTicketSuccess } from "./ticket_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class TicketEffects {
    private actions$ = inject(Actions);
    fetchTicketList$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchTicketListData),
            mergeMap(() =>
                this.restApiService.getTicketData().pipe(
                    map((Ticketlist) => {
                        const Ticket = JSON.parse(Ticketlist).data;
                        return fetchTicketListSuccess({ Ticket })
                    }),
                    catchError((error) =>
                        of(fetchTicketListFailure({ error }))
                    )
                )
            ),
        ),
    );

    addTicketData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addTicket),
            mergeMap(({ newData }) =>
                this.restApiService.postTicketData(newData).pipe(
                    map((responseData) => addTicketSuccess({ newData: responseData.data })),
                    catchError((error) => of(addTicketFailure({ error })))
                )
            )
        )
    )

    updateTicketData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateTicket),
            mergeMap(({ updatedData }) =>
                this.restApiService.patchTicketData(updatedData).pipe(
                    map((responseData) => updateTicketSuccess({ updatedData: responseData.data })),
                    catchError((error) => of(addTicketFailure({ error })))
                )
            )
        )
    );

    deleteTicket$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteTicket),
            mergeMap(({ id }) =>
                this.restApiService.deleteTicket(id).pipe(
                    map(() => deleteTicketSuccess({ id })),
                    catchError((error) => of(deleteTicketFailure({ error })))
                )
            )
        )
    );

    constructor(
        private restApiService: restApiService
    ) { }
}