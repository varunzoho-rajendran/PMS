import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Error Interceptor - Handles HTTP errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
        console.error('❌ Client-side error:', error.error.message);
      } else {
        // Server-side error
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
        console.error(`❌ Server error: ${error.status}`, error.message);
        
        // Handle specific error codes
        switch (error.status) {
          case 401:
            // Unauthorized - redirect to login
            console.warn('🔒 Unauthorized access - redirecting to login');
            localStorage.removeItem('pms_current_user');
            localStorage.removeItem('pms_auth_token');
            router.navigate(['/login']);
            alert('Your session has expired. Please login again.');
            break;
            
          case 403:
            // Forbidden
            console.warn('🚫 Access forbidden');
            alert('You do not have permission to perform this action.');
            break;
            
          case 404:
            // Not found
            console.warn('🔍 Resource not found');
            alert('The requested resource was not found.');
            break;
            
          case 500:
            // Internal server error
            console.error('💥 Server error');
            alert('An internal server error occurred. Please try again later.');
            break;
            
          case 0:
            // Network error
            console.error('🌐 Network error - server unreachable');
            alert('Unable to connect to the server. Please check your internet connection.');
            break;
            
          default:
            alert(`Error: ${errorMessage}`);
        }
      }
      
      // Re-throw the error so it can be handled by the calling code if needed
      return throwError(() => new Error(errorMessage));
    })
  );
};
