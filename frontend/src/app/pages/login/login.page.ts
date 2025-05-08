import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  async login() {
    const body = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>('http://localhost:8000/api/login', body).subscribe({
      next: async (res) => {
        localStorage.setItem('token', res.token);  // Menyimpan token setelah login sukses
        await this.showToast('Login berhasil!');
        this.router.navigate(['/home']);  // Navigasi ke halaman home
      },
      error: async (err) => {
        await this.showToast('Login gagal! Cek email/password');
        console.error(err);
      }
    });
  }

  // Fungsi untuk menampilkan toast message
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'primary'
    });
    toast.present();
  }

  // Fungsi untuk menavigasi ke halaman register
  goToRegister() {
    this.router.navigate(['/register']);
  }
}
