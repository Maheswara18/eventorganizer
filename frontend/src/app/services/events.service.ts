import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private async getHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async getAllEvents(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/events`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  }

  async getEvent(id: number): Promise<any> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/events/${id}`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  async createEvent(eventData: any): Promise<any> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/events`, eventData, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(id: number, eventData: any): Promise<any> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.put<any>(
          `${this.apiUrl}/events/${id}`,
          eventData,
          {
            headers,
            withCredentials: true
          }
        )
      );
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<any> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.delete<any>(`${this.apiUrl}/events/${id}`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async registerForEvent(eventId: number, formData?: any): Promise<any> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/events/${eventId}/register`, formData || {}, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  async getRegisteredEvents(): Promise<any> {
    try {
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/events/registered`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error getting registered events:', error);
      throw error;
    }
  }

  async isRegistered(eventId: number): Promise<boolean> {
    return this.checkRegistration(eventId);
  }

  async checkRegistration(eventId: number): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.get<{registered: boolean}>(`${this.apiUrl}/events/${eventId}/check-registration`, {
          headers,
          withCredentials: true
        })
      );
      return response.registered;
    } catch (error) {
      console.error('Error checking registration:', error);
      throw error;
    }
  }

  async cancelRegistration(eventId: number): Promise<any> {
    try {
      console.log('Canceling registration for event:', eventId);
      const headers = await this.getHeaders();
      return firstValueFrom(
        this.http.delete<any>(`${this.apiUrl}/events/${eventId}/registration`, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error canceling registration:', error);
      throw error;
    }
  }
} 