import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../../services/certificate.service';
import { LoadingController, IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.page.html',
  styleUrls: ['./certificates.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class CertificatesPage implements OnInit {
  certificates: any[] = [];
  loading = false;
  isAdmin = false;

  constructor(
    private certificateService: CertificateService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadCertificates();
    this.checkAdminStatus();
  }

  private async checkAdminStatus() {
    const user = await this.authService.currentUser.toPromise();
    this.isAdmin = user?.role === 'admin';
  }

  async loadCertificates() {
    const loading = await this.loadingCtrl.create({
      message: 'Memuat sertifikat...'
    });
    await loading.present();
    this.loading = true;

    try {
      this.certificates = await this.certificateService.getAllCertificates().toPromise();
    } catch (error) {
      console.error('Error loading certificates:', error);
      this.showToast('Gagal memuat sertifikat', 'danger');
    } finally {
      this.loading = false;
      loading.dismiss();
    }
  }

  async downloadCertificate(certificateId: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Mengunduh sertifikat...'
    });
    await loading.present();

    try {
      const blob = await this.certificateService.downloadCertificate(certificateId).toPromise();

      if (!blob) {
        throw new Error('File tidak ditemukan.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.showToast('Sertifikat berhasil diunduh', 'success');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      this.showToast('Gagal mengunduh sertifikat', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async verifyCertificate(certificateId: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Memverifikasi sertifikat...'
    });
    await loading.present();

    try {
      const result = await this.certificateService.verifyCertificate({ certificateId }).toPromise();
      this.showToast(
        result.valid ? 'Sertifikat valid' : 'Sertifikat tidak valid',
        result.valid ? 'success' : 'warning'
      );
    } catch (error) {
      console.error('Error verifying certificate:', error);
      this.showToast('Gagal memverifikasi sertifikat', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
