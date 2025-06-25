import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, TimeoutError, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { timeout, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private tokenKey = 'auth_token';
  private initialized = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<any>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  async initialize() {
    if (!this.initialized) {
      const token = await this.getToken();
      if (token) {
        try {
          const headers = await this.getHeaders();
          const response = await firstValueFrom(
            this.http.get(`${this.apiUrl}/user`, { headers })
          );
          this.currentUserSubject.next(response);
        } catch (error) {
          console.error('Error initializing auth:', error);
          await this.removeToken();
        }
      }
      this.initialized = true;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    await this.initialize();
    return this.currentUserValue !== null;
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user && user.role === 'admin';
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await this.get(this.tokenKey);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await this.set(this.tokenKey, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await this.remove(this.tokenKey);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private async get(key: string): Promise<any> {
    return localStorage.getItem(key);
  }

  private async set(key: string, value: any): Promise<void> {
    localStorage.setItem(key, value);
  }

  private async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async getHeaders(): Promise<HttpHeaders> {
    const token = await this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async login(credentials: any) {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/login`, credentials, {
          headers,
          withCredentials: true
        }).pipe(
          timeout(15000),
          catchError(error => {
            if (error instanceof TimeoutError) {
              throw new Error('Request timed out');
            }
            throw error;
          })
        )
      );

      if (response && response.token) {
        await this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/logout`, {}, {
          headers,
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      await this.removeToken();
      this.currentUserSubject.next(null);
      this.initialized = false;
      this.router.navigate(['/login']);
    }
  }

  async register(userData: any) {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/register`, userData, {
          headers,
          withCredentials: true
        })
      );

      if (response && response.token) {
        await this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
}
