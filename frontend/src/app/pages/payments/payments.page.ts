import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PaymentService, Payment, RegisteredEvent } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule
  ]
})
export class PaymentsPage implements OnInit {
  activeSegment = 'registered';
  payments: Payment[] = [];
  registeredEvents: RegisteredEvent[] = [];
  isLoading = false;
  isProcessing = false;
  processingEventId: number | null = null;
  environment = environment;
  isAdmin = false;

  get unpaidEvents(): RegisteredEvent[] {
    // Dapatkan ID event yang sudah dibayar (completed atau paid)
    const paidEventIds = this.registeredEvents
      .filter(event => event.payment_status === 'completed' || event.payment_status === 'paid')
      .map(event => event.id);

    // Filter event yang belum dibayar (tidak ada di paidEventIds)
    return this.registeredEvents.filter(event => !paidEventIds.includes(event.id));
  }

  get paidEvents(): RegisteredEvent[] {
    // Filter event yang sudah dibayar (completed atau paid)
    return this.registeredEvents
      .filter(event => event.payment_status === 'completed' || event.payment_status === 'paid')
      .sort((a, b) => {
        // Jika ada tanggal registrasi, gunakan itu untuk pengurutan
        const dateA = a.registration_date ? new Date(a.registration_date) : new Date(a.start_datetime);
        const dateB = b.registration_date ? new Date(b.registration_date) : new Date(b.start_datetime);
        return dateB.getTime() - dateA.getTime();
      });
  }

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadData();
  }

  ionViewWillEnter() {
    // Reload data setiap kali halaman akan ditampilkan
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      // Load data secara bersamaan
      const [payments, registeredEvents] = await Promise.all([
        this.paymentService.getPayments(),
        this.paymentService.getRegisteredEvents()
      ]);

      console.log('Payments:', payments); // Debug
      console.log('Registered Events:', registeredEvents); // Debug

      this.payments = payments;
      this.registeredEvents = registeredEvents;

    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Gagal memuat data', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async updatePaymentStatus(paymentId: number, status: string) {
    try {
      await this.paymentService.updatePaymentStatus(paymentId, status);
      await this.loadData();
      this.showToast('Status pembayaran berhasil diperbarui', 'success');
    } catch (error) {
      console.error('Error updating payment status:', error);
      this.showToast('Gagal memperbarui status pembayaran', 'danger');
    }
  }

  async simulatePayment(eventId: number) {
    this.isProcessing = true;
    this.processingEventId = eventId;
    try {
      await this.paymentService.simulatePayment(eventId);
      await this.loadData(); // Refresh data setelah pembayaran
      this.showToast('Pembayaran berhasil', 'success');
      // Pindah ke tab riwayat setelah pembayaran berhasil
      this.activeSegment = 'payments';
    } catch (error) {
      console.error('Error simulating payment:', error);
      this.showToast('Pembayaran gagal', 'danger');
    } finally {
      this.isProcessing = false;
      this.processingEventId = null;
    }
  }

  segmentChanged(event: any) {
    this.activeSegment = event.detail.value;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 