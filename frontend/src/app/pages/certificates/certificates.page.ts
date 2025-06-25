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

    try {
      const blob = await this.certificateService.downloadCertificate(certificateId).toPromise();
      if (!blob) throw new Error('File tidak ditemukan');

      const isCordova = !!(window as any).cordova;
      if (isCordova) {
        // Deteksi versi Android
        const info = await Device.getInfo();
        const isAndroid = info.platform === 'android';
        const androidVersion = parseInt((info.osVersion || '0').split('.')[0]);
        if (isAndroid && androidVersion >= 11) {
          // Android 11+ gunakan penyimpanan internal aplikasi
          const base64 = await this.blobToBase64(blob);
          const filename = `sertifikat-${certificateId}.pdf`;
          await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Documents
          });
          this.showToast('Sertifikat berhasil disimpan di folder aplikasi (Documents)', 'success');
        } else {
          // Android < 11, tetap gunakan plugin file dan izin eksternal
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
        }
      } else {
        // Cara download di browser, tanpa plugin native
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sertifikat-${certificateId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.showToast('Sertifikat berhasil diunduh', 'success');
      }
    } catch (error) {
      // Hanya tampilkan alert error di device
      if (!!(window as any).cordova) {
        alert('Gagal menyimpan sertifikat: ' + JSON.stringify(error));
      }
      this.showToast('Gagal mengunduh sertifikat', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
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
