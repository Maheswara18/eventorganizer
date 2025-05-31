import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiEndpoint = environment.apiEndpoint;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.authService.getToken();
    return {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getAllEvents(): Promise<any[]> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiEndpoint}/events`, {
        headers,
        withCredentials: true
      })
    );
  }

  async getEvent(id: number): Promise<any> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.get<any>(`${this.apiEndpoint}/events/${id}`, {
        headers,
        withCredentials: true
      })
    );
  }

  async createEvent(eventData: any): Promise<any> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.post<any>(`${this.apiEndpoint}/events`, eventData, {
        headers,
        withCredentials: true
      })
    );
  }

  async updateEvent(id: number, eventData: any): Promise<any> {
    console.log('Updating event with ID:', id);
    
    let headers = await this.getHeaders();
    
    // Jika eventData adalah FormData, hapus Content-Type
    if (eventData instanceof FormData) {
      const { 'Content-Type': removed, ...headersCopy } = headers;
      headers = headersCopy;
    }

    try {
      // Kirim request update
      const response = await firstValueFrom(
        this.http.post<any>(
          `${this.apiEndpoint}/events/${id}`, 
          eventData,
          {
            headers,
            withCredentials: true
          }
        )
      );
      
      console.log('Update response:', response);
      return response;
    } catch (error: any) {
      console.error('Update error:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<any> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.delete<any>(`${this.apiEndpoint}/events/${id}`, {
        headers,
        withCredentials: true
      })
    );
  }

  async registerEvent(eventId: number): Promise<any> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.post<any>(`${this.apiEndpoint}/events/${eventId}/register`, {}, {
        headers,
        withCredentials: true
      })
    );
  }

  async getRegisteredEvents(): Promise<any[]> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiEndpoint}/events/registered`, {
        headers,
        withCredentials: true
      })
    );
  }

  async isRegistered(eventId: number): Promise<boolean> {
    const headers = await this.getHeaders();
    try {
      const response = await firstValueFrom(
        this.http.get<{registered: boolean}>(`${this.apiEndpoint}/events/${eventId}/check-registration`, {
          headers,
          withCredentials: true
        })
      );
      return response?.registered || false;
    } catch {
      return false;
    }
  }
} 