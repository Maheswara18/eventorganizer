import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getPayments(): Promise<Payment[]> {
    try {
      return await firstValueFrom(
        this.http.get<Payment[]>(`${this.apiUrl}/payments`)
      );
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getRegisteredEvents(): Promise<RegisteredEvent[]> {
    try {
      return await firstValueFrom(
        this.http.get<RegisteredEvent[]>(`${this.apiUrl}/events/registered`)
      );
    } catch (error) {
      console.error('Error fetching registered events:', error);
      throw error;
    }
  }

  async updatePaymentStatus(paymentId: number, status: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.apiUrl}/payments/${paymentId}/status`, { status })
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  async simulatePayment(eventId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/payments/simulate/${eventId}`, {})
      );
    } catch (error) {
      console.error('Error simulating payment:', error);
      throw error;
    }
  }
} 