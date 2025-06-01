import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule
  ]
})
export class ProfilePage implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = false;
  showPasswordForm = false;

  constructor(
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private toastController: ToastController
  ) {
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: [{value: '', disabled: true}]
    });

    this.passwordForm = this.formBuilder.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.isLoading = true;
      const profile = await this.profileService.getProfile();
      this.profileForm.patchValue({
        name: profile.name,
        email: profile.email
      });
    } catch (error: any) {
      this.showToast('Gagal memuat profil: ' + error.message, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async updateProfile() {
    if (this.profileForm.invalid) {
      this.showToast('Mohon lengkapi semua field yang diperlukan', 'warning');
      return;
    }

    try {
      this.isLoading = true;
      const profileData = {
        name: this.profileForm.get('name')?.value
      };
      await this.profileService.updateProfile(profileData);
      this.showToast('Profil berhasil diperbarui', 'success');
    } catch (error: any) {
      this.showToast('Gagal memperbarui profil: ' + error.message, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async updatePassword() {
    if (this.passwordForm.invalid) {
      this.showToast('Mohon lengkapi semua field password dengan benar', 'warning');
      return;
    }

    try {
      this.isLoading = true;
      await this.profileService.updatePassword(this.passwordForm.value);
      this.showToast('Password berhasil diperbarui', 'success');
      this.passwordForm.reset();
      this.showPasswordForm = false;
    } catch (error: any) {
      let errorMessage = 'Gagal memperbarui password';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.showToast(errorMessage, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('password_confirmation')?.value
      ? null
      : { mismatch: true };
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
} 