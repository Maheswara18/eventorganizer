import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) { }

  getAllEvents(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getEvent(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createEvent(eventData: any): Observable<any> {
    return this.http.post(this.apiUrl, eventData);
  }

  updateEvent(id: number, eventData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, eventData);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 