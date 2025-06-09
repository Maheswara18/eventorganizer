import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`);
  }

  getRegistrationChart(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/registrations`);
  }

  getRevenueChart(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/revenue`);
  }

  getRecentActivities(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/activities`);
  }
} 