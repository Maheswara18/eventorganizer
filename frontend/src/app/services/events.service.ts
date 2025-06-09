import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Event as EventModel, EventResponse, RegisteredEvent } from '../interfaces/event.interface';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private async getHeaders(isMultipart = false): Promise<HttpHeaders> {
    let headers = new HttpHeaders();
    if (!isMultipart) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  async getEvents(): Promise<EventModel[]> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<EventModel[]>(`${this.apiUrl}/events`, {
          headers,
          withCredentials: true
        })
      );
      console.log('API Response:', response); // Debug log
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEvent(id: number): Promise<EventModel> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<EventModel>(`${this.apiUrl}/events/${id}`, {
          headers,
          withCredentials: true
        })
      );
      if (!response) {
        throw new Error('Event not found');
      }
      return response;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
  }
  }

  async createEvent(eventData: FormData): Promise<EventModel> {
    try {
      const headers = await this.getHeaders(true);
      return firstValueFrom(
        this.http.post<EventModel>(`${this.apiUrl}/events`, eventData, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(id: number, eventData: FormData): Promise<EventModel> {
    try {
      const headers = await this.getHeaders(true);
      eventData.append('_method', 'PUT');
      return firstValueFrom(
        this.http.post<EventModel>(`${this.apiUrl}/events/${id}`, eventData, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/events/${id}`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async registerForEvent(eventId: number, formData: any): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/events/${eventId}/register`, formData, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  async unregisterFromEvent(eventId: number): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/events/${eventId}/unregister`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    }
  }

  async getRegisteredEvents(): Promise<RegisteredEvent[]> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<RegisteredEvent[]>(`${this.apiUrl}/events/registered`, {
          headers,
          withCredentials: true
        })
      );
      return response || [];
    } catch (error) {
      console.error('Error fetching registered events:', error);
      throw error;
    }
  }

  async checkRegistration(eventId: number): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<EventResponse>(`${this.apiUrl}/events/${eventId}/check-registration`, {
          headers,
          withCredentials: true
        })
      );
      return response.registered || false;
    } catch (error) {
      console.error('Error checking registration:', error);
      throw error;
    }
  }

  async getEventStatistics(eventId: number): Promise<any> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/events/${eventId}/statistics`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error getting event statistics:', error);
      throw error;
    }
  }

  async getCurrentUserId(): Promise<number> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    return currentUser.id;
  }
} 