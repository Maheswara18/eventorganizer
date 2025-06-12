import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { firstValueFrom, BehaviorSubject, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface EventDetails {
  id: number;
  title: string;
  start_datetime: string;
  image_path?: string;
}

export interface Payment {
  id: number;
  event_id: number;
  user_id: number;
  amount: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'paid';
  created_at: string;
  updated_at: string;
  event?: EventDetails;
}

export interface RegisteredEvent {
  id: number;
  title: string;
  price: number;
  start_datetime: string;
  image_path?: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'paid';
  registration_date?: string;
  payment_proof_path?: string;
}

export type BackendPaymentStatus = 'pending' | 'completed' | 'failed';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;
  private paymentStatusSubject = new BehaviorSubject<{eventId: number, status: BackendPaymentStatus} | null>(null);
  public paymentStatus$ = this.paymentStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private async getHeaders(): Promise<HttpHeaders> {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  getAllPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/admin`);
  }

  updatePaymentStatus(id: number, status: BackendPaymentStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/payments/${id}/status`, { status });
  }

  getPaymentsByEvent(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/event/${eventId}`);
  }

  getPaymentsByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/user/${userId}`);
  }

  createPayment(paymentData: any): Observable<any> {
    return this.http.post(this.apiUrl + '/payments', paymentData);
  }

  async getPayments(): Promise<Payment[]> {
    try {
      return await firstValueFrom(
        this.http.get<Payment[]>(this.apiUrl + '/payments/admin')
      );
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getRegisteredEvents(): Promise<RegisteredEvent[]> {
    try {
      return await firstValueFrom(
        this.http.get<RegisteredEvent[]>(this.apiUrl + '/payments/events/registered')
      );
    } catch (error) {
      console.error('Error fetching registered events:', error);
      throw error;
    }
  }

  async simulatePayment(eventId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(this.apiUrl + '/payments/simulate/' + eventId, {})
      );
    } catch (error) {
      console.error('Error simulating payment:', error);
      throw error;
    }
  }

  async submitPayment(eventId: number, formData: FormData): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/payments/${eventId}`, formData, {
          headers,
          withCredentials: true
        })
      );

      // Emit perubahan status setelah submit payment berhasil
      this.paymentStatusSubject.next({ eventId, status: 'completed' });
      
      return response;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  }

  async getPaymentStatus(eventId: number): Promise<BackendPaymentStatus> {
    try {
      const response = await firstValueFrom(
        this.http.get<{status: BackendPaymentStatus}>(`${this.apiUrl}/payments/${eventId}/status`, {
          headers: await this.getHeaders(),
          withCredentials: true
        })
      );
      return response.status;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }
} 