import { inject, Injectable } from "@angular/core";

import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Actions, createEffect, ofType } from "@ngrx/effects";

import { addCustomer, addCustomerFailure, addCustomerSuccess, addOrder, addOrderFailure, addOrderSuccess, deleteCustomer, deleteCustomerFailure, deleteCustomerSuccess, deleteOrder, deleteOrderFailure, deleteOrderSuccess, deleteProduct, deleteProductFailure, deleteProductSuccess, fetchCustomerListData, fetchCustomerListFailure, fetchCustomerListSuccess, fetchProductListData, fetchProductListFailure, fetchProductListSuccess, fetchSellerListData, fetchSellerListFailure, fetchSellerListSuccess, fetchorderListData, fetchorderListFailure, fetchorderListSuccess, updateCustomer, updateCustomerFailure, updateCustomerSuccess, updateOrder, updateOrderFailure, updateOrderSuccess } from "./ecommerce_action";
import { restApiService } from "../../core/services/rest-api.service";


@Injectable()
export class EcommerceEffects {
private actions$ = inject(Actions);
    // Product
    fetchProductData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchProductListData),
            mergeMap(() =>
                this.restApiService.getData().pipe(
                    map((product) => {
                        const Product = JSON.parse(product).data;
                        return fetchProductListSuccess({ Product })
                    }),
                    catchError((error) =>
                        of(fetchProductListFailure({ error }))
                    )
                )
            ),
        ),
    );

    deleteProductData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteProduct),
            mergeMap(({ id }) =>
                this.restApiService.deleteData(id).pipe(
                    map(() => deleteProductSuccess({ id })),
                    catchError((error) => of(deleteProductFailure({ error })))
                )
            )
        )
    );

    // Order
    fetchData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchorderListData),
            mergeMap(() =>
                this.restApiService.getOrderData().pipe(
                    map((orders) => {
                        const order = JSON.parse(orders).data;
                        return fetchorderListSuccess({ order })
                    }),
                    catchError((error) =>
                        of(fetchorderListFailure({ error }))
                    )
                )
            ),
        ),
    );

    addData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addOrder),
            mergeMap(({ newData }) =>
                this.restApiService.postOrderData(newData).pipe(
                    map((responseData) => addOrderSuccess({ newData: responseData.data })),
                    catchError((error) => of(addOrderFailure({ error })))
                )
            )
        )
    )

    updateData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateOrder),
            mergeMap(({ updatedData }) =>
                this.restApiService.patchOrderData(updatedData).pipe(
                    map((responseData) => updateOrderSuccess({ updatedData: responseData.data })),
                    catchError((error) => of(addOrderFailure({ error })))
                )
            )
        )
    );


    deleteData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteOrder),
            mergeMap(({ id }) =>
                this.restApiService.deleteOrder(id).pipe(
                    map(() => deleteOrderSuccess({ id })),
                    catchError((error) => of(deleteOrderFailure({ error })))
                )
            )
        )
    );

    // Customer
    fetchCustomerData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(fetchCustomerListData),
            mergeMap(() =>
                this.restApiService.getCustomerData().pipe(
                    map((Customers) => {
                        const Customer = JSON.parse(Customers).data;
                        return fetchCustomerListSuccess({ Customer })
                    }),
                    catchError((error) =>
                        of(fetchCustomerListFailure({ error }))
                    )
                )
            ),
        ),
    );

    addCustomerData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(addCustomer),
            mergeMap(({ newData }) =>
                this.restApiService.postCustomerData(newData).pipe(
                    map((responseData) => addCustomerSuccess({ newData: responseData.data })),
                    catchError((error) => of(addCustomerFailure({ error })))
                )
            )
        )
    )

    updateCustomerData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateCustomer),
            mergeMap(({ updatedData }) =>
                this.restApiService.patchCustomerData(updatedData).pipe(
                    map((responseData) => updateCustomerSuccess({ updatedData: responseData.data })),
                    catchError((error) => of(updateCustomerFailure({ error })))
                )
            )
        )
    );


    deleteCustomerData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(deleteCustomer),
            mergeMap(({ id }) =>
                this.restApiService.deleteCustomer(id).pipe(
                    map(() => deleteCustomerSuccess({ id })),
                    catchError((error) => of(deleteCustomerFailure({ error })))
                )
            )
        )
    );

      // Seller
      fetchSellerData$ = createEffect(() =>
      this.actions$.pipe(
          ofType(fetchSellerListData),
          mergeMap(() =>
              this.restApiService.getSellerData().pipe(
                  map((Seller) => {
                      return fetchSellerListSuccess({ Seller })
                  }),
                  catchError((error) =>
                      of(fetchSellerListFailure({ error }))
                  )
              )
          ),
      ),
  );


    constructor(
        private restApiService: restApiService
    ) { }
}