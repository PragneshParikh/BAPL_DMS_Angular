import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { fetchCryptoOrderData, fetchCryptoOrderFailure, fetchCryptoOrderSuccess, fetchCryptoTransactionData, fetchCryptoTransactionFailure, fetchCryptoTransactionSuccess } from "./crypto_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class CryptoEffects {
private actions$ = inject(Actions);
    // contact
    fetchCryptoOrderData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchCryptoOrderData),
            mergeMap(() =>
                this.restApiService.getCryptoOrderData().pipe(
                    map((CryptoOrder) => {
                        return fetchCryptoOrderSuccess({ CryptoOrder })
                    }),
                    catchError((error) =>
                        of(fetchCryptoOrderFailure({ error }))
                    )
                )
            ),
        ),
    );

    // Company
    fetchTransactionData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchCryptoTransactionData),
            mergeMap(() =>
                this.restApiService.getTransactionData().pipe(
                    map((Transaction) => {
                        return fetchCryptoTransactionSuccess({ Transaction })
                    }),
                    catchError((error) =>
                        of(fetchCryptoTransactionFailure({ error }))
                    )
                )
            ),
        ),
    );

    constructor(
        private restApiService: restApiService
    ) { }
}