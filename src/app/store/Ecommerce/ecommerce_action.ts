import { createAction, props } from '@ngrx/store';
import { CartModel, OrdersModel, customerModel, productModel, sellerModel } from './ecommerce_model';

// Product
export const fetchProductListData = createAction('[Data] Fetch ProductList');
export const fetchProductListSuccess = createAction('[Data] Fetch ProductList Success',props<{ Product: productModel[] }>());
export const fetchProductListFailure = createAction('[Data] Fetch ProductList Failure', props<{ error: string }>());

// Order
export const fetchorderListData = createAction('[Data] Fetch orderList');
export const fetchorderListSuccess = createAction('[Data] Fetch orderList Success',props<{ order: OrdersModel[] }>());
export const fetchorderListFailure = createAction('[Data] Fetch orderList Failure', props<{ error: string }>());

// Customer
export const fetchCustomerListData = createAction('[Data] Fetch CustomerList');
export const fetchCustomerListSuccess = createAction('[Data] Fetch CustomerList Success',props<{ Customer: customerModel[] }>());
export const fetchCustomerListFailure = createAction('[Data] Fetch CustomerList Failure', props<{ error: string }>());

// Seller
export const fetchSellerListData = createAction('[Data] Fetch SellerList');
export const fetchSellerListSuccess = createAction('[Data] Fetch SellerList Success',props<{ Seller: sellerModel[] }>());
export const fetchSellerListFailure = createAction('[Data] Fetch SellerList Failure', props<{ error: string }>());


// Add Data
export const addOrder = createAction(
    '[Data] Add Order',
    props<{ newData: OrdersModel }>()
);
export const addOrderSuccess = createAction(
    '[Data] Add Order Success',
    props<{ newData: OrdersModel }>()
);
export const addOrderFailure = createAction(
    '[Data] Add Order Failure',
    props<{ error: string }>()
);

// Update Data
export const updateOrder = createAction(
    '[Data] Update Order',
    props<{ updatedData: OrdersModel }>()
);
export const updateOrderSuccess = createAction(
    '[Data] Update Order Success',
    props<{ updatedData: OrdersModel }>()
);
export const updateOrderFailure = createAction(
    '[Data] Update Order Failure',
    props<{ error: string }>()
);


// Delete Order Data
export const deleteOrder = createAction(
    '[Data] Delete Order',
    props<{ id: string }>()
);
export const deleteOrderSuccess = createAction(
    '[Data] Delete Order Success',
    props<{ id: string }>()
);
export const deleteOrderFailure = createAction(
    '[Data] Delete Order Failure',
    props<{ error: string }>()
);

// Delete Product Data
export const deleteProduct = createAction(
    '[Data] Delete Product',
    props<{ id: string }>()
);
export const deleteProductSuccess = createAction(
    '[Data] Delete Product Success',
    props<{ id: string }>()
);
export const deleteProductFailure = createAction(
    '[Data] Delete Product Failure',
    props<{ error: string }>()
);

// Add Customer Data
export const addCustomer = createAction(
    '[Data] Add Customer',
    props<{ newData: customerModel }>()
);
export const addCustomerSuccess = createAction(
    '[Data] Add Customer Success',
    props<{ newData: customerModel }>()
);
export const addCustomerFailure = createAction(
    '[Data] Add Customer Failure',
    props<{ error: string }>()
);

// Update Data
export const updateCustomer = createAction(
    '[Data] Update Customer',
    props<{ updatedData: customerModel }>()
);
export const updateCustomerSuccess = createAction(
    '[Data] Update Customer Success',
    props<{ updatedData: customerModel }>()
);
export const updateCustomerFailure = createAction(
    '[Data] Update Customer Failure',
    props<{ error: string }>()
);


// Delete Customer Data
export const deleteCustomer = createAction(
    '[Data] Delete Customer',
    props<{ id: string }>()
);
export const deleteCustomerSuccess = createAction(
    '[Data] Delete Customer Success',
    props<{ id: string }>()
);
export const deleteCustomerFailure = createAction(
    '[Data] Delete Customer Failure',
    props<{ error: string }>()
);