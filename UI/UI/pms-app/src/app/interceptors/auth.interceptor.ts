import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor - Adds authentication token to outgoing HTTP requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get auth token from localStorage
  const token = localStorage.getItem('pms_auth_token');
  
  // If token exists, clone the request and add Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('🔐 Auth Interceptor: Added token to request', req.url);
  }
  
  return next(req);
};
