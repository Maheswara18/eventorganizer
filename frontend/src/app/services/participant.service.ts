import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedParticipants, Participant } from '../interfaces/participant.interface';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private apiUrl = `${environment.apiUrl}/participants`;

  constructor(private http: HttpClient) {}

  getParticipants(
    page: number = 1,
    search: string = '',
    eventId?: number
  ): Observable<PaginatedParticipants> {
    let params = new HttpParams()
      .set('page', page.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (eventId) {
      params = params.set('event_id', eventId.toString());
    }

    return this.http.get<PaginatedParticipants>(this.apiUrl, { params });
  }

  getParticipantsByEvent(eventId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/event/${eventId}`);
  }

  getParticipant(id: number): Observable<Participant> {
    return this.http.get<Participant>(`${this.apiUrl}/${id}`);
  }

  createParticipant(participant: Partial<Participant>): Observable<Participant> {
    return this.http.post<Participant>(this.apiUrl, participant);
  }

  updateParticipant(participant: Participant): Observable<Participant> {
    return this.http.put<Participant>(`${this.apiUrl}/${participant.id}`, participant);
  }

  updateStatus(id: number, status: 'registered' | 'present' | 'absent'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteParticipant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportParticipants(search?: string, eventId?: number): Observable<Blob> {
    let params = new HttpParams();

    if (search) {
      params = params.set('search', search);
    }
    if (eventId) {
      params = params.set('event_id', eventId.toString());
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  getMyParticipantByEvent(eventId: number): Observable<Participant> {
    return this.http.get<Participant>(`${this.apiUrl}/event/${eventId}/me`);
  }

  getParticipantStatus(eventId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/events/${eventId}/participant-status`);
  }
}