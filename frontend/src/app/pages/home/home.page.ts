import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {

  constructor(
    private router: Router,
    private toastController: ToastController,
    private authService: AuthService
  ) {}

  async logout() {
    try {
      await this.authService.logout();
      await this.showToast('Anda berhasil logout', 'success');
      this.router.navigate(['/login']);
    } catch (error) {
      if (error instanceof Error) {
        await this.showToast('Logout gagal: ' + error.message, 'danger');
      } else {
        await this.showToast('Logout gagal: Terjadi kesalahan.', 'danger');
      }
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }
}
