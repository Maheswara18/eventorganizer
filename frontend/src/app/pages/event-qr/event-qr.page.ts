/**
 * Event QR Scanner Page
 * Halaman untuk scan QR code peserta event
 * Dibuat ulang dengan fitur yang lebih lengkap dan UI yang lebih baik
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-event-qr',
  templateUrl: './event-qr.page.html',
  styleUrls: ['./event-qr.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class EventQrPage implements OnInit, OnDestroy {
  @ViewChild('qrReader', { static: false }) qrReader!: ElementRef;

  isScanning = false;
  qrScanner: Html5Qrcode | null = null;
  scanHistory: any[] = [];
  currentParticipant: any = null;
  showParticipantInfo = false;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    // Cek apakah user adalah admin
    const user = this.authService.currentUserValue;
    if (!user || user.role !== 'admin') {
      await this.router.navigate(['/home']);
      const toast = await this.toastController.create({
        message: 'Anda tidak memiliki akses ke halaman ini',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    // Inisialisasi QR Scanner
    this.initializeScanner();
  }

  ngOnDestroy() {
    this.stopScan();
  }

  private initializeScanner() {
    try {
      if (!this.qrScanner) {
        const config = {
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
          // Setting `useBarCodeDetectorIfSupported` to true is the default.
          // We will let the library decide the best engine to use.
          verbose: false, 
        };
        this.qrScanner = new Html5Qrcode('qr-reader', config);
      }
    } catch (error) {
      console.error('Error initializing scanner:', error);
    }
  }

  // Fungsi untuk meminta izin kamera secara eksplisit (Android)
  private async requestCameraPermission() {
    if (Capacitor.getPlatform() === 'android') {
      try {
        const result = await Camera.requestPermissions();
        if (result.camera !== 'granted') {
          const toast = await this.toastController.create({
            message: 'Akses kamera diperlukan untuk scan QR. Silakan izinkan kamera.',
            duration: 3000,
            color: 'danger'
          });
          await toast.present();
          throw new Error('Izin kamera tidak diberikan');
        }
      } catch (err) {
        console.error('Gagal meminta izin kamera:', err);
        throw err;
      }
    }
  }

  async startScan() {
    try {
      // Minta izin kamera sebelum inisialisasi scanner
      await this.requestCameraPermission();

      if (!this.qrScanner) {
        this.initializeScanner();
      }

      if (!this.qrScanner) {
        throw new Error('QR Scanner tidak dapat diinisialisasi');
      }

      this.isScanning = true;
      this.showParticipantInfo = false;
      this.currentParticipant = null;

      const loading = await this.loadingController.create({ message: 'Mempersiapkan kamera...' });
      await loading.present();

      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          throw new Error('Tidak ada kamera yang ditemukan.');
        }

        // Prefer back camera, but fall back to the first available camera.
        const cameraId = cameras.find(c => c.label.toLowerCase().includes('back'))?.id || cameras[0].id;
        
        const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.8);
          return {
            width: qrboxSize,
            height: qrboxSize,
          };
        };
        
        await loading.dismiss();
      await this.qrScanner.start(
          cameraId, // Use specific camera ID
        {
            fps: 5, // Reduce FPS to improve performance on some devices
            qrbox: qrboxFunction,
            disableFlip: false,
        },
        this.processQrCode.bind(this),
        (errorMessage: string) => {
            // Ignore errors, they happen constantly when no QR is in view
          }
        );

      } catch (e: any) {
        await loading.dismiss();
        throw e; // Re-throw to be caught by the outer catch block
      }

    } catch(e: any) {
      console.error('Error starting camera:', e);
      let message = 'Error saat memulai scan QR code. Pastikan Anda telah memberikan izin kamera.';
      
      if (typeof e === 'string') {
        message = e;
      } else if (e.name === "NotAllowedError") {
        message = "Akses kamera tidak diizinkan. Mohon izinkan akses kamera di pengaturan browser Anda.";
      } else if (e.name === "NotFoundError") {
        message = "Tidak ada kamera yang ditemukan di perangkat ini.";
      } else if (e.message) {
        message = e.message;
      }

      const toast = await this.toastController.create({
        message: message,
        duration: 4000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.stopScan();
    }
  }

  private async processQrCode(decodedText: string) {
    if (this.showParticipantInfo) {
      return; // Already processing a QR code
    }

    try {
      console.log('QR Code detected:', decodedText);
      
      // Stop scanning temporarily
      await this.stopScan();

      // Show loading
      const loading = await this.loadingController.create({
        message: 'Memproses QR Code...',
        spinner: 'crescent'
      });
      await loading.present();

      // Check participant first
      const checkResponse = await this.http.post(`${environment.apiUrl}/scan-qr/check`, {
        qr_code_data: decodedText
      }).toPromise();
      
      if (checkResponse && (checkResponse as any).success) {
        this.currentParticipant = (checkResponse as any).participant;
        this.showParticipantInfo = true;
        await loading.dismiss();
      } else {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: 'QR code tidak valid atau peserta tidak ditemukan',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
        this.startScan();
      }

    } catch(error: any) {
      console.error('Error processing QR code:', error);
      const toast = await this.toastController.create({
        message: error.message || 'QR code tidak valid',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      this.startScan();
    }
  }

  async confirmAttendance() {
    if (!this.currentParticipant) return;

    const alert = await this.alertController.create({
      header: 'Konfirmasi Kehadiran',
      message: `Apakah Anda yakin ingin mencatat kehadiran untuk <strong>${this.currentParticipant.name}</strong>?`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Ya, Catat Kehadiran',
          handler: () => {
            this.recordAttendance();
          }
        }
      ]
    });

    await alert.present();
  }

  private async recordAttendance() {
    try {
      const loading = await this.loadingController.create({
        message: 'Mencatat kehadiran...',
        spinner: 'crescent'
      });
      await loading.present();

      const qrData = `participant-${this.currentParticipant.id}-${this.currentParticipant.event_id}`;
      
      const response = await this.http.post(`${environment.apiUrl}/scan-qr`, {
        qr_code_data: qrData
      }).toPromise();

      await loading.dismiss();

      if (response && (response as any).success) {
        // Add to scan history
        this.scanHistory.unshift({
          ...this.currentParticipant,
          scan_time: new Date(),
          status: 'success'
        });

        const toast = await this.toastController.create({
          message: 'Kehadiran berhasil dicatat!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        // Reset and continue scanning
        this.showParticipantInfo = false;
        this.currentParticipant = null;
        setTimeout(() => {
          this.startScan();
        }, 1000);
      } else {
        const toast = await this.toastController.create({
          message: (response as any).message || 'Gagal mencatat kehadiran',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
        this.startScan();
      }

    } catch(error: any) {
      console.error('Error recording attendance:', error);
      const toast = await this.toastController.create({
        message: 'Terjadi kesalahan saat mencatat kehadiran',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      this.startScan();
    }
  }

  async cancelAttendance() {
    this.showParticipantInfo = false;
    this.currentParticipant = null;
    this.startScan();
  }

  async stopScan() {
    if (this.qrScanner && this.isScanning) {
      try {
        await this.qrScanner.stop();
      } catch(e) {
        console.error(e);
      }
    }
    this.isScanning = false;
  }

  async viewScanHistory() {
    if (this.scanHistory.length === 0) {
      const toast = await this.toastController.create({
        message: 'Belum ada riwayat scan',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Riwayat Scan QR',
      message: this.scanHistory.map(item => 
        `<div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <strong>${item.name}</strong><br>
          Event: ${item.event_title}<br>
          Waktu: ${new Date(item.scan_time).toLocaleString('id-ID')}<br>
          Status: ${this.getStatusText(item.attendance_status)}
        </div>`
      ).join(''),
      buttons: ['Tutup']
    });

    await alert.present();
  }

  clearScanHistory() {
    this.scanHistory = [];
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'registered':
        return 'Terdaftar';
      case 'present':
        return 'Hadir';
      case 'absent':
        return 'Tidak Hadir';
      default:
        return status;
    }
  }

  getPaymentText(status: string): string {
    switch (status) {
      case 'belum_bayar':
        return 'Belum Bayar';
      case 'sudah_bayar':
        return 'Sudah Bayar';
      case 'pending':
        return 'Menunggu';
      default:
        return status;
    }
  }
} 