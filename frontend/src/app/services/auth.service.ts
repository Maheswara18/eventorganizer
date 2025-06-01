import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { Observable, BehaviorSubject, TimeoutError, firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
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
  private initPromise: Promise<void> | null = null;
  private readonly TIMEOUT_DURATION = 5000; // Reduced to 5 seconds

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router
  ) {}

  async initialize() {
    if (!this.initPromise) {
      this.initPromise = this.initStorage();
    }
    return this.initPromise;
  }

  private async initStorage() {
    if (!this.storageReady) {
      try {
        await this.storage.create();
        this.storageReady = true;
        await this.loadStoredUser();
      } catch (error) {
        console.error('Error initializing storage:', error);
        this.storageReady = false;
        throw new Error('Gagal menginisialisasi storage');
      }
    }
  }

  private async loadStoredUser() {
    try {
      const authState = await this.storage.get(this.authStateKey);
      if (authState && authState.token && authState.user) {
        // Set user first, then validate token
        this.currentUserSubject.next(authState.user);
        
        // Validate token in background
        this.validateToken(authState.token).catch(async (error) => {
          console.error('Background token validation failed:', error);
          await this.clearAuthState();
          this.router.navigate(['/login'], { replaceUrl: true });
        });
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      await this.clearAuthState();
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.apiEndpoint}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).pipe(
          timeout(this.TIMEOUT_DURATION),
          catchError((error) => {
            if (error instanceof TimeoutError) {
              throw new Error('Koneksi timeout');
            }
            throw error;
          })
        )
      );
      
      return !!response;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }

  private async clearAuthState() {
    try {
      await this.storage.remove(this.authStateKey);
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }

  private async getCsrfToken() {
    try {
      await firstValueFrom(
        this.http.get(`${this.apiUrl}/sanctum/csrf-cookie`, {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }).pipe(
          timeout(this.TIMEOUT_DURATION)
        )
      );
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      if (error instanceof TimeoutError) {
        throw new Error('Koneksi timeout saat mengambil CSRF token');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = await this.getToken();
      if (token) {
        await firstValueFrom(
          this.http.post(`${this.apiEndpoint}/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).pipe(
            timeout(this.TIMEOUT_DURATION)
          )
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await this.clearAuthState();
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  async login(credentials: any) {
    await this.initialize();
    
    try {
      await this.getCsrfToken();
      
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiEndpoint}/login`, credentials, {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }).pipe(
          timeout(this.TIMEOUT_DURATION),
          catchError((error: HttpErrorResponse) => {
            if (error instanceof TimeoutError) {
              throw new Error('Koneksi timeout saat login');
            }
            if (error.status === 401) {
              throw new Error('Email atau password salah');
            }
            if (error.status === 429) {
              throw new Error('Terlalu banyak percobaan login. Silakan coba lagi nanti');
            }
            throw error;
          })
        )
      );
      
      if (response && response.token) {
        await this.storage.set(this.authStateKey, {
          token: response.token,
          user: response.user
        });
        this.currentUserSubject.next(response.user);
        return response;
      }
      throw new Error('Respons server tidak valid');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    await this.initialize();
    const authState = await this.storage.get(this.authStateKey);
    return authState ? authState.token : null;
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.initialize();
      return this.currentUserSubject.value !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user && user.role === 'admin';
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}
