import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PaymentService, Payment, RegisteredEvent } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

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
  payments: Payment[] = [];
  registeredEvents: RegisteredEvent[] = [];
  isLoading = false;
  isAdmin = false;
  activeSegment = 'payments';

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

  async loadData() {
    if (this.activeSegment === 'payments') {
      await this.loadPayments();
    } else {
      await this.loadRegisteredEvents();
    }
  }

  async loadPayments() {
    try {
      this.isLoading = true;
      this.payments = await this.paymentService.getPayments();
    } catch (error: any) {
      console.error('Error loading payments:', error);
      this.showToast('Gagal memuat data pembayaran', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async loadRegisteredEvents() {
    try {
      this.isLoading = true;
      this.registeredEvents = await this.paymentService.getRegisteredEvents();
    } catch (error: any) {
      console.error('Error loading registered events:', error);
      this.showToast('Gagal memuat data event', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async updatePaymentStatus(paymentId: number, status: 'completed' | 'failed') {
    try {
      await this.paymentService.updatePaymentStatus(paymentId, status);
      this.showToast('Status pembayaran berhasil diperbarui', 'success');
      await this.loadPayments();
      await this.loadRegisteredEvents();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      this.showToast('Gagal memperbarui status pembayaran', 'danger');
    }
  }

  async simulatePayment(eventId: number) {
    const loading = await this.loadingController.create({
      message: 'Memproses pembayaran...',
      spinner: 'circular'
    });

    try {
      await loading.present();
      await this.paymentService.simulatePayment(eventId);
      this.showToast('Pembayaran berhasil', 'success');
      this.activeSegment = 'payments';
      this.loadPayments();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      this.showToast('Gagal memproses pembayaran', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  segmentChanged(event: any) {
    this.activeSegment = event.detail.value;
    this.loadData();
  }

  getStatusColor(status: 'pending' | 'completed' | 'failed'): string {
    switch (status) {
      case 'completed':
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
      currency: 'IDR'
    }).format(price);
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