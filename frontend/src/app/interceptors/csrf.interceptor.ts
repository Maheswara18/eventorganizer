import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get XSRF token from cookie
    const xsrfToken = this.getXsrfToken();
    
    // Clone the request and add headers
    request = request.clone({
      withCredentials: true,
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken || ''
      }
    });

    return next.handle(request);
  }

  private getXsrfToken(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
} 