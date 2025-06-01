import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController, IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    IonicStorageModule
  ]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.initForm();
  }

  async ngOnInit() {
    try {
      // Check if already logged in
      const isLoggedIn = await this.authService.isLoggedIn();
      if (isLoggedIn) {
        this.router.navigate(['/home'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  }

  private initForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async login() {
    if (!this.loginForm.valid) {
      await this.showToast('Mohon isi semua field dengan benar', 'warning');
      return;
    }

    let loading;
    try {
      this.isLoading = true;
      loading = await this.loadingCtrl.create({
        message: 'Logging in...',
        duration: 10000 // Timeout after 10 seconds
      });
      await loading.present();

      const response = await this.authService.login(this.loginForm.value);
      if (response && response.token) {
        await this.showToast('Login berhasil!', 'success');
        this.router.navigate(['/home'], { replaceUrl: true });
      } else {
        throw new Error('Login gagal: Tidak ada token');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Login gagal! Cek email/password';
      
      if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      await this.showToast(errorMessage, 'danger');
    } finally {
      this.isLoading = false;
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
