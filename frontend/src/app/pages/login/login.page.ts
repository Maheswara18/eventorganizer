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
  ],
  providers: [AuthService]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.initForm();
  }

  ngOnInit() {
    // Form sudah diinisialisasi di constructor
  }

  private initForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async login() {
    if (this.loginForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Logging in...'
      });
      await loading.present();

      try {
        await this.authService.login(this.loginForm.value);
        loading.dismiss();
        await this.showToast('Login berhasil!', 'success');
        this.router.navigate(['/home']);
      } catch (err: any) {
        loading.dismiss();
        console.error('Login error:', err);
        await this.showToast(
          err?.error?.message || 'Login gagal! Cek email/password',
          'danger'
        );
      }
    } else {
      await this.showToast('Mohon isi semua field dengan benar', 'warning');
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
