import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 * Logging Interceptor - Logs all HTTP requests and responses
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();
  
  console.log('📤 HTTP Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers.keys(),
    body: req.body
  });
  
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          console.log('📥 HTTP Response:', {
            method: req.method,
            url: req.url,
            status: event.status,
            statusText: event.statusText,
            duration: `${duration}ms`,
            body: event.body
          });
        }
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        console.error('📥 HTTP Error:', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          error: error
        });
      }
    })
  );
};
