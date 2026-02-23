import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { deleteInvoice, deleteInvoiceFailure, deleteInvoiceSuccess, fetchInvoiceListData, fetchInvoiceListFailure, fetchInvoiceListSuccess } from "./invoice_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class InvoiceEffects {
    private actions$ = inject(Actions);
    fetchInvoiceList$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchInvoiceListData),
            mergeMap(() =>
                this.restApiService.getInvoiceData().pipe(
                    map((invoicelist) => {
                        const Invoice = JSON.parse(invoicelist).data;
                        return fetchInvoiceListSuccess({ Invoice })
                    }),
                    catchError((error) =>
                        of(fetchInvoiceListFailure({ error }))
                    )
                )
            ),
        ),
    );

    deleteInvoice$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteInvoice),
            mergeMap(({ id }) =>
                this.restApiService.deleteInvoice(id).pipe(
                    map(() => deleteInvoiceSuccess({ id })),
                    catchError((error) => of(deleteInvoiceFailure({ error })))
                )
            )
        )
    );

    constructor(
        private restApiService: restApiService
    ) { }
}