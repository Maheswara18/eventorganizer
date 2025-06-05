import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalParticipants: number;
  pendingPayments: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface Activity {
  icon: string;
  color: string;
  title: string;
  description: string;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`)
      .pipe(catchError(this.handleError));
  }

  getRegistrationChart(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/admin/dashboard/registrations`)
      .pipe(catchError(this.handleError));
  }

  getRevenueChart(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/admin/dashboard/revenue`)
      .pipe(catchError(this.handleError));
  }

  getRecentActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/admin/dashboard/activities`)
      .pipe(catchError(this.handleError));
  }
} 