// src/app/pages/register/register.page.ts
import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule,
    HttpClientModule
  ]
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  password_confirmation = '';
  role = 'participant'; // Default role
  isLoading = false; // Added loading state

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  async register() {
    // Validate form before submitting
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true; // Show loading state

    const body = {
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.password_confirmation,
      role: this.role,
    };

    try {
      const res = await this.http.post<any>(`${environment.apiUrl}/register`, body).toPromise();
      await this.showToast('Registrasi berhasil! Silakan login', 'success');
      this.router.navigate(['/login']);
    } catch (err) {
      this.handleError(err as HttpErrorResponse);
    } finally {
      this.isLoading = false; // Hide loading state
    }
  }

  private validateForm(): boolean {
    if (!this.name || !this.email || !this.password || !this.password_confirmation) {
      this.showToast('Harap isi semua field!', 'warning');
      return false;
    }

    if (this.password !== this.password_confirmation) {
      this.showToast('Password dan konfirmasi password tidak sama!', 'warning');
      return false;
    }

    if (this.password.length < 8) {
      this.showToast('Password minimal 8 karakter!', 'warning');
      return false;
    }

    return true;
  }

  private handleError(err: HttpErrorResponse) {
    console.error('Registration error:', err);
    
    let errorMessage = 'Registrasi gagal! Coba lagi';
    
    if (err.status === 0) {
      errorMessage = 'Tidak dapat terhubung ke server';
    } else if (err.status === 422) {
      // Handle validation errors from Laravel
      const errors = err.error.errors;
      errorMessage = 'Validasi gagal: ';
      
      if (errors?.email) {
        errorMessage += errors.email[0];
      } else if (errors?.password) {
        errorMessage += errors.password[0];
      } else {
        errorMessage += 'Data tidak valid';
      }
    } else if (err.status === 500) {
      errorMessage = 'Terjadi kesalahan server. Silakan coba lagi nanti';
    }

    this.showToast(errorMessage, 'danger');
  }

  async showToast(message: string, color: 'primary' | 'success' | 'warning' | 'danger' = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
    });
    toast.present();
  }
}