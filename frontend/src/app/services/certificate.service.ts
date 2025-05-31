import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) { }

  getAllCertificates(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getCertificate(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createCertificate(certificateData: any): Observable<any> {
    return this.http.post(this.apiUrl, certificateData);
  }

  verifyCertificate(verificationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify`, verificationData);
  }
} 