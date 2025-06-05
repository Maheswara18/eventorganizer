import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { PaymentService, QRCode } from '../../services/payment.service';

@Component({
  selector: 'app-event-qr',
  templateUrl: './event-qr.page.html',
  styleUrls: ['./event-qr.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class EventQRPage implements OnInit {
  qrCode: QRCode | null = null;
  loading = false;
  eventId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId = parseInt(id);
      this.loadQRCode();
    }
  }

  async loadQRCode() {
    if (!this.eventId) return;

    const loading = await this.loadingCtrl.create({
      message: 'Memuat QR Code...'
    });
    await loading.present();

    try {
      this.qrCode = await this.paymentService.getAttendanceQR(this.eventId);
    } catch (error) {
      console.error('Error loading QR code:', error);
      const toast = await this.toastCtrl.create({
        message: 'Gagal memuat QR Code. Pastikan Anda sudah membayar event ini.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async refreshQRCode(event: any) {
    try {
      await this.loadQRCode();
    } finally {
      event.target.complete();
    }
  }
} 