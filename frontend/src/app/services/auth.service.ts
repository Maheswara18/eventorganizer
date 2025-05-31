import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private apiEndpoint = environment.apiEndpoint;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private storageReady = false;
  private authStateKey = 'auth_state';

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router
  ) {
    this.initStorage();
  }

  async initStorage() {
    if (!this.storageReady) {
      await this.storage.create();
      this.storageReady = true;
      await this.loadStoredUser();
    }
  }

  private async loadStoredUser() {
    try {
      const authState = await this.storage.get(this.authStateKey);
      if (authState && authState.token && authState.user) {
        this.currentUserSubject.next(authState.user);
        // Opsional: Validasi token dengan backend
        this.validateToken(authState.token);
      } else {
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      this.router.navigate(['/login']);
    }
  }

  private async validateToken(token: string) {
    try {
      const response = await this.http.get(`${this.apiEndpoint}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).toPromise();
      
      if (!response) {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      await this.logout();
    }
  }

  private async getCsrfToken() {
    try {
      await this.http.get(`${this.apiUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }).toPromise();
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = await this.getToken();
      if (token) {
        await this.http.post(`${this.apiEndpoint}/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).toPromise();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await this.storage.remove(this.authStateKey);
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  async login(credentials: any) {
    try {
      await this.getCsrfToken();
      
      const response = await this.http.post<any>(`${this.apiEndpoint}/login`, credentials, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }).toPromise();
      
      if (response && response.token) {
        await this.storage.set(this.authStateKey, {
          token: response.token,
          user: response.user
        });
        this.currentUserSubject.next(response.user);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    const authState = await this.storage.get(this.authStateKey);
    return authState ? authState.token : null;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user && user.role === 'admin';
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}
