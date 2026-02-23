import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { addCompany, addCompanyFailure, addCompanySuccess, addContact, addContactFailure, addContactSuccess, addLead, addLeadFailure, addLeadSuccess, deleteCompany, deleteCompanyFailure, deleteCompanySuccess, deleteContact, deleteContactFailure, deleteContactSuccess, deleteLead, deleteLeadFailure, deleteLeadSuccess, fetchCrmCompanyData, fetchCrmCompanyFailure, fetchCrmCompanySuccess, fetchCrmContactData, fetchCrmContactFailure, fetchCrmContactSuccess, fetchCrmDealData, fetchCrmDealFailure, fetchCrmDealSuccess, fetchCrmLeadData, fetchCrmLeadFailure, fetchCrmLeadSuccess, updateCompany, updateCompanyFailure, updateCompanySuccess, updateContact, updateContactFailure, updateContactSuccess, updateLead, updateLeadFailure, updateLeadSuccess } from "./crm_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class CRMEffects {
private actions$ = inject(Actions);
    // contact
    fetchContactData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchCrmContactData),
            mergeMap(() =>
                this.restApiService.getContactData().pipe(
                    map((contactlist) => {
                        const Contact = JSON.parse(contactlist).data;
                        return fetchCrmContactSuccess({ Contact })
                    }),
                    catchError((error) =>
                        of(fetchCrmContactFailure({ error }))
                    )
                )
            ),
        ),
    );

    addContactData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addContact),
            mergeMap(({ newData }) =>
                this.restApiService.postContactData(newData).pipe(
                    map((responseData) => addContactSuccess({ newData: responseData.data })),
                    catchError((error) => of(addContactFailure({ error })))
                )
            )
        )
    )

    updateContactData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateContact),
            mergeMap(({ updatedData }) =>
                this.restApiService.patchContactData(updatedData).pipe(
                    map((responseData) => updateContactSuccess({ updatedData: responseData.data })),
                    catchError((error) => of(updateContactFailure({ error })))
                )
            )
        )
    );


    deleteContactData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteContact),
            mergeMap(({ id }) =>
                this.restApiService.deleteContact(id).pipe(
                    map(() => deleteContactSuccess({ id })),
                    catchError((error) => of(deleteContactFailure({ error })))
                )
            )
        )
    );

    // Company
    fetchCompanyData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchCrmCompanyData),
            mergeMap(() =>
                this.restApiService.getCompanyData().pipe(
                    map((companylist) => {
                        const Company = JSON.parse(companylist).data;
                        return fetchCrmCompanySuccess({ Company })
                    }),
                    catchError((error) =>
                        of(fetchCrmCompanyFailure({ error }))
                    )
                )
            ),
        ),
    );

    addCompanyData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addCompany),
            mergeMap(({ newData }) =>
                this.restApiService.postCompanyData(newData).pipe(
                    map((responseData) => addCompanySuccess({ newData: responseData.data })),
                    catchError((error) => of(addCompanyFailure({ error })))
                )
            )
        )
    )

    updateCompanyData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateCompany),
            mergeMap(({ updatedData }) =>
                this.restApiService.patchCompanyData(updatedData).pipe(
                    map((responseData) => updateCompanySuccess({ updatedData: responseData.data })),
                    catchError((error) => of(updateCompanyFailure({ error })))
                )
            )
        )
    );


    deleteCompanyData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteCompany),
            mergeMap(({ id }) =>
                this.restApiService.deleteCompany(id).pipe(
                    map(() => deleteCompanySuccess({ id })),
                    catchError((error) => of(deleteCompanyFailure({ error })))
                )
            )
        )
    );

    // Deal
    fetchDealData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchCrmDealData),
            mergeMap(() =>
                this.restApiService.getDealData().pipe(
                    map((Deal) => {
                        return fetchCrmDealSuccess({ Deal })
                    }),
                    catchError((error) =>
                        of(fetchCrmDealFailure({ error }))
                    )
                )
            ),
        ),
    );

    // Lead
    fetchLeadData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchCrmLeadData),
            mergeMap(() =>
                this.restApiService.getLeadData().pipe(
                    map((Leadlist) => {
                        const Lead = JSON.parse(Leadlist).data;
                        return fetchCrmLeadSuccess({ Lead })
                    }),
                    catchError((error) =>
                        of(fetchCrmLeadFailure({ error }))
                    )
                )
            ),
        ),
    );

    addLeadData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addLead),
            mergeMap(({ newData }) =>
                this.restApiService.postLeadData(newData).pipe(
                    map((responseData) => addLeadSuccess({ newData: responseData.data })),
                    catchError((error) => of(addLeadFailure({ error })))
                )
            )
        )
    )

    updateLeadData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateLead),
            mergeMap(({ updatedData }) =>
                this.restApiService.patchLeadData(updatedData).pipe(
                    map((responseData) => updateLeadSuccess({ updatedData: responseData.data })),
                    catchError((error) => of(updateLeadFailure({ error })))
                )
            )
        )
    );


    deleteLeadData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteLead),
            mergeMap(({ id }) =>
                this.restApiService.deletelead(id).pipe(
                    map(() => deleteLeadSuccess({ id })),
                    catchError((error) => of(deleteLeadFailure({ error })))
                )
            )
        )
    );

    constructor(
        private restApiService: restApiService
    ) { }
}