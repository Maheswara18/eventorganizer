import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonicModule, RouterModule]
})
export class HomePage implements OnInit {
  isAdmin = false;
  username = '';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.checkAdminStatus();
    await this.loadUserInfo();
  }

  async checkAdminStatus() {
    try {
      await this.authService.initialize(); // Pastikan auth sudah diinisialisasi
      this.isAdmin = this.authService.isAdmin();
      console.log('Is Admin:', this.isAdmin); // Debug log
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  async loadUserInfo() {
    try {
      const user = this.authService.currentUserValue;
      this.username = user?.name || '';
      console.log('Current user:', user); // Debug log
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

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
