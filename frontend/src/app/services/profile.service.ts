import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
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

  async getProfile(): Promise<any> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.get<any>(`${this.apiEndpoint}/profile`, {
        headers,
        withCredentials: true
      })
    );
  }

  async updateProfile(profileData: any): Promise<any> {
    const headers = await this.getHeaders();
    return firstValueFrom(
      this.http.put<any>(`${this.apiEndpoint}/profile`, profileData, {
        headers,
        withCredentials: true
      })
    );
  }

  async updatePassword(passwordData: { 
    current_password: string; 
    password: string; 
    password_confirmation: string 
  }): Promise<any> {
    const headers = await this.getHeaders();
    const data = {
      current_password: passwordData.current_password,
      new_password: passwordData.password,
      new_password_confirmation: passwordData.password_confirmation
    };
    return firstValueFrom(
      this.http.put<any>(`${this.apiEndpoint}/profile/password`, data, {
        headers,
        withCredentials: true
      })
    );
  }
} 