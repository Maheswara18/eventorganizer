import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const isLoggedIn = await this.authService.isLoggedIn();
      
      if (isLoggedIn) {
        return true;
      }

      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    } catch (error) {
      console.error('Auth guard error:', error);
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }
  }
} 