// src/app/pages/register/register.page.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  password_confirmation = '';
  role = 'participant'; // Default role

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  async register() {
    const body = {
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.password_confirmation,
      role: this.role,
    };

    this.http.post<any>('http://localhost:8000/api/register', body).subscribe({
      next: async (res) => {
        await this.showToast('Registrasi berhasil! Silakan login');
        this.router.navigate(['/login']);
      },
      error: async (err) => {
        await this.showToast('Registrasi gagal! Coba lagi');
        console.error(err);
      }
    });
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'primary',
    });
    toast.present();
  }
}
