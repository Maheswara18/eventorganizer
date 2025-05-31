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
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Coba load stored user jika belum
    await this.authService.initStorage();

    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Redirect ke halaman login jika user belum login
    this.router.navigate(['/login']);
    return false;
  }
} 