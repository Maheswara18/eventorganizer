import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../../services/certificate.service';
import { LoadingController, IonicModule, ToastController, AlertController, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';

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
    private authService: AuthService,
    private alertCtrl: AlertController,
    private platform: Platform
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

  async verifyCertificate(certificateId: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Memverifikasi sertifikat...'
    });
    await loading.present();

    try {
      const certificate = this.certificates.find(c => c.id === certificateId);
      if (!certificate) {
        throw new Error('Sertifikat tidak ditemukan');
      }

      const result = await this.certificateService.verifyCertificate({ 
        verification_code: certificate.verification_code 
      }).toPromise();

      const alert = await this.alertCtrl.create({
        header: result.valid ? 'Sertifikat Valid' : 'Sertifikat Tidak Valid',
        message: result.valid ? 
          `Sertifikat ini diterbitkan untuk ${result.certificate.participant_name} pada acara "${result.certificate.event_title}"` :
          result.message,
        buttons: ['OK']
      });
      await alert.present();
    } catch (error) {
      console.error('Error verifying certificate:', error);
      this.showToast('Gagal memverifikasi sertifikat', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async downloadCertificate(certificateId: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Mengunduh sertifikat...'
    });
    await loading.present();
    let timeoutHandle: any;
    let timeoutOccured = false;
    try {
      console.log('[Download] Mulai proses download sertifikat');
      const blob = await this.certificateService.downloadCertificate(certificateId).toPromise();
      if (!blob) throw new Error('File tidak ditemukan');
      console.log('[Download] Blob didapat, size:', blob.size);
      const isCordova = !!(window as any).cordova;
      if (isCordova) {
        const info = await Device.getInfo();
        const isAndroid = info.platform === 'android';
        const androidVersion = parseInt((info.osVersion || '0').split('.')[0]);
        console.log('[Download] isCordova:', isCordova, 'isAndroid:', isAndroid, 'androidVersion:', androidVersion);
        if (isAndroid && androidVersion >= 11) {
          // Android 11+ buka file di browser eksternal, tanpa konversi base64
          const certificate = this.certificates.find(c => c.id === certificateId);
          const fileUrl = certificate?.certificate_download_url;
          console.log('[Download] fileUrl:', fileUrl, 'certificate:', certificate);
          if (fileUrl) {
            window.open(fileUrl, '_system'); // Cordova: _system, fallback: _blank
            this.showToast('Sertifikat dibuka di browser. Silakan simpan dari sana.', 'success');
          } else {
            this.showToast('Link download sertifikat tidak ditemukan.', 'danger');
          }
          await loading.dismiss();
          return;
        } else if (isAndroid) {
          const { File } = await import('@awesome-cordova-plugins/file/ngx');
          const { AndroidPermissions } = await import('@awesome-cordova-plugins/android-permissions/ngx');
          const file = new File();
          const androidPermissions = new AndroidPermissions();
          await androidPermissions.requestPermissions([
            androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE,
            androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE
          ]);
          const hasPerm = await androidPermissions.checkPermission(androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
          if (!hasPerm.hasPermission) {
            alert('Izin penyimpanan tidak diberikan. Tidak bisa menyimpan file.');
            this.showToast('Izin penyimpanan tidak diberikan', 'danger');
            return;
          }
          const filename = `sertifikat-${certificateId}.pdf`;
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          await file.writeFile(file.externalRootDirectory + 'Download/', filename, uint8Array, {replace: true});
          alert('Sertifikat berhasil disimpan di: ' + file.externalRootDirectory + 'Download/' + filename);
          this.showToast('Sertifikat berhasil disimpan di Download', 'success');
          console.log('[Download] Sukses simpan di Download Android <11');
        }
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sertifikat-${certificateId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.showToast('Sertifikat berhasil diunduh', 'success');
        console.log('[Download] Sukses download di web');
      }
    } catch (error) {
      if (timeoutOccured) {
        this.showToast('Timeout saat mengunduh sertifikat', 'danger');
        console.log('[Download] Timeout error:', error);
      } else {
        this.showToast('Gagal mengunduh sertifikat: ' + String(error), 'danger');
        console.log('Error utama download:', error);
      }
    } finally {
      clearTimeout(timeoutHandle);
      loading.dismiss();
      console.log('[Download] Selesai proses download');
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      let timeout = setTimeout(() => {
        reject(new Error('Timeout konversi blob ke base64'));
      }, 10000);
      reader.onloadend = () => {
        clearTimeout(timeout);
        const base64data = (reader.result as string).split(',')[1];
        console.log('[Download] blobToBase64 selesai');
        resolve(base64data);
      };
      reader.onerror = (err) => {
        clearTimeout(timeout);
        console.log('[Download] blobToBase64 error:', err);
        reject(err);
      };
      console.log('[Download] blobToBase64 mulai');
      reader.readAsDataURL(blob);
    });
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
