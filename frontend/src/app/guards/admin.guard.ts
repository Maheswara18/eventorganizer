import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  async canActivate(): Promise<boolean> {
    if (this.authService.isAdmin()) {
      return true;
    }

    const toast = await this.toastController.create({
      message: 'Akses ditolak. Hanya admin yang dapat mengakses halaman ini.',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();

    this.router.navigate(['/events']);
    return false;
  }
} 