import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) { }

  getAllPayments(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getPayment(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createPayment(paymentData: any): Observable<any> {
    return this.http.post(this.apiUrl, paymentData);
  }

  updatePaymentStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { status });
  }
} 