import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface Participant {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  event: {
    id: number;
    title: string;
    start_datetime: string;
  };
  registration_date: string;
  attendance_status: 'registered' | 'present' | 'absent';
  qr_code_path: string;
  payment?: {
    id: number;
    amount: number;
    payment_status: string;
    payment_method: string;
  };
  form_responses?: {
    field_id: number;
    value: string;
  }[];
}

export interface ParticipantFilter {
  event_id?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getParticipants(filters: ParticipantFilter = {}): Promise<{ participants: Participant[], total: number }> {
    let params = new HttpParams();
    
    if (filters.event_id) params = params.set('event_id', filters.event_id.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
    if (filters.sort_direction) params = params.set('sort_direction', filters.sort_direction);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());

    return firstValueFrom(
      this.http.get<{ participants: Participant[], total: number }>(`${this.apiUrl}/participants`, { params })
    );
  }

  async updateAttendance(participantId: number, status: 'present' | 'absent'): Promise<Participant> {
    return firstValueFrom(
      this.http.put<Participant>(`${this.apiUrl}/participants/${participantId}`, {
        attendance_status: status
      })
    );
  }

  async getParticipantDetails(participantId: number): Promise<Participant> {
    return firstValueFrom(
      this.http.get<Participant>(`${this.apiUrl}/participants/${participantId}`)
    );
  }

  async exportParticipants(eventId: number, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`${this.apiUrl}/events/${eventId}/participants/export`, {
        params: { format },
        responseType: 'blob'
      })
    );
  }
} 