import { Action, createReducer, on } from '@ngrx/store';
import { addCustomerSuccess, addOrderSuccess, deleteCustomerSuccess, deleteOrderSuccess, deleteProductSuccess, fetchCustomerListData, fetchCustomerListFailure, fetchCustomerListSuccess, fetchProductListData, fetchProductListFailure, fetchProductListSuccess, fetchSellerListData, fetchSellerListFailure, fetchSellerListSuccess, fetchorderListData, fetchorderListFailure, fetchorderListSuccess, updateCustomerSuccess, updateOrderSuccess } from './ecommerce_action';

export interface EcommerceState {
  order: any[];
  Product: any[];
  Customer: any[];
  Seller: any[];
  loading: boolean;
  error: any;
}

export const initialState: EcommerceState = {
  order: [],
  Product: [],
  Customer: [],
  Seller: [],
  loading: false,
  error: null,
};

export const ecommercerReducer = createReducer(
  initialState,
  // Product
  on(fetchProductListData, (state) => {
    return { ...state, loading: true, error: null };
  }),
  on(fetchProductListSuccess, (state, { Product }) => {
    return { ...state, Product, loading: false };
  }),
  on(fetchProductListFailure, (state, { error }) => {
    return { ...state, error, loading: false };
  }),

  on(deleteProductSuccess, (state, { id }) => {
    const updatedProduct = state.Product.filter((product) => !id.includes(product._id));
    return { ...state, Product: updatedProduct, error: null };
  }),

  // Order
  on(fetchorderListData, (state) => {
    return { ...state, loading: true, error: null };
  }),
  on(fetchorderListSuccess, (state, { order }) => {
    return { ...state, order, loading: false };
  }),
  on(fetchorderListFailure, (state, { error }) => {
    return { ...state, error, loading: false };
  }),

  on(addOrderSuccess, (state, { newData }) => {
    return { ...state, order: [newData, ...state.order], error: null };
  }),

  on(updateOrderSuccess, (state, { updatedData }) => {
    return {
      ...state, order: state.order.map((orders) => orders.orderId === updatedData.orderId ? updatedData : orders), error: null
    };
  }),

  on(deleteOrderSuccess, (state, { id }) => {
    const updatedOrder = state.order.filter((order) => !id.includes(order._id));
    return { ...state, order: updatedOrder, error: null };
  }),

  // Customer
  on(fetchCustomerListData, (state) => {
    return { ...state, loading: true, error: null };
  }),
  on(fetchCustomerListSuccess, (state, { Customer }) => {
    return { ...state, Customer, loading: false };
  }),
  on(fetchCustomerListFailure, (state, { error }) => {
    return { ...state, error, loading: false };
  }),

  on(addCustomerSuccess, (state, { newData }) => {
    return { ...state, Customer: [newData, ...state.Customer], error: null };
  }),

  on(updateCustomerSuccess, (state, { updatedData }) => {
    return {
   
      ...state, Customer: state.Customer.map((customer) => customer._id === updatedData._id ? updatedData : customer), error: null
    };
  }),

  on(deleteCustomerSuccess, (state, { id }) => {
    const updatedCustomer = state.Customer.filter((customer) => !id.includes(customer._id));
    return { ...state, Customer: updatedCustomer, error: null };
  }),

  // Seller
  on(fetchSellerListData, (state) => {
    return { ...state, loading: true, error: null };
  }),
  on(fetchSellerListSuccess, (state, { Seller }) => {
    return { ...state, Seller, loading: false };
  }),
  on(fetchSellerListFailure, (state, { error }) => {
    return { ...state, error, loading: false };
  }),

);

// Selector
export function reducer(state: EcommerceState | undefined, action: Action) {
  return ecommercerReducer(state, action);
}
