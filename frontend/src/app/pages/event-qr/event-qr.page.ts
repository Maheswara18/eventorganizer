import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Html5Qrcode } from 'html5-qrcode';
import { EventsService } from '../../services/events.service';
import { ParticipantService } from '../../services/participant.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-event-qr',
  templateUrl: './event-qr.page.html',
  styleUrls: ['./event-qr.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class EventQrPage implements OnInit, OnDestroy {
  isScanning = false;
  qrScanner: Html5Qrcode | null = null;

  constructor(
    private eventsService: EventsService,
    private participantService: ParticipantService,
    private toastController: ToastController,
    private router: Router,
    private authService: AuthService
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
        this.qrScanner = new Html5Qrcode('reader');
      }
    } catch (error) {
      console.error('Error initializing scanner:', error);
    }
  }

  async startScan() {
    try {
      if (!this.qrScanner) {
        this.initializeScanner();
      }

      if (!this.qrScanner) {
        throw new Error('QR Scanner tidak dapat diinisialisasi');
      }

      this.isScanning = true;
      
      await this.qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        this.processQrCode.bind(this),
        (errorMessage: string) => {
          console.error(errorMessage);
        }
      );
    } catch(e) {
      console.error(e);
      const toast = await this.toastController.create({
        message: 'Error saat memulai scan QR code',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      this.stopScan();
    }
  }

  private async processQrCode(decodedText: string) {
    try {
      // Format QR: participant-{participantId}-{eventId}
      const [prefix, participantId, eventId] = decodedText.split('-');
      
      if (prefix !== 'participant' || !participantId || !eventId) {
        throw new Error('QR code tidak valid');
      }

      // Update status kehadiran peserta
      await this.participantService.updateStatus(Number(participantId), 'present');

      const toast = await this.toastController.create({
        message: 'Kehadiran peserta berhasil dicatat',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      // Redirect ke halaman manajemen peserta dengan filter event
      await this.router.navigate(['/participant-management'], { 
        queryParams: { event_id: eventId }
      });
    } catch(error: any) {
      const toast = await this.toastController.create({
        message: error.message || 'QR code tidak valid',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.stopScan();
    }
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
} 