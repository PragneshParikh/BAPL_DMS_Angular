import { HttpInterceptorFn } from '@angular/common/http';

/**
 * This interceptor automatically adds the Authorization header to all requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token'); // Or get it from a service
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    return next(req);
};