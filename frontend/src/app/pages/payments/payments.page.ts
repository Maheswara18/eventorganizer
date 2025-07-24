import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController, ModalController } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { PaymentService, Payment, RegisteredEvent } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface PaymentFormData {
  event_id: number;
  amount: number;
  payment_method: 'transfer' | 'credit_card' | 'e_wallet';
  payment_proof_path?: string;
}

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
  registeredEvents: RegisteredEvent[] = [];
  isLoading = false;
  isProcessing = false;
  processingEventId: number | null = null;
  environment = environment;
  isAdmin = false;
  showProofModal = false;
  selectedProofUrl: string | null = null;

  showPaymentModal = false;
  selectedEvent: RegisteredEvent | null = null;
  paymentData: PaymentFormData = {
    event_id: 0,
    amount: 0,
    payment_method: 'transfer'
  };
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSubmitting = false;

  eventId: number | null = null;
  returnUrl: string | null = null;

  // ✅ Tambahan untuk deteksi tab aktif
  activePath: string = '';
  isPollingPaymentStatus = false; // <--- Tambahan: status polling
  pollingEventId: number | null = null; // <--- Tambahan: event yang sedang dipolling
  pollingCountdown: number = 0; // <--- Tambahan: countdown polling

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['eventId']) {
        this.eventId = Number(params['eventId']);
      }
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    // ✅ Deteksi path aktif dari URL
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activePath = event.urlAfterRedirects;
      }
    });
  }

  async ngOnInit() {
    if (this.eventId) {
      await this.pollForNewEvent(this.eventId);
    } else {
      await this.loadData();
    }
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const registeredEvents = await this.paymentService.getRegisteredEvents();
      this.registeredEvents = registeredEvents;
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Gagal memuat data', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  get unpaidEvents(): RegisteredEvent[] {
    return this.registeredEvents.filter(event =>
      event.payment_status === 'belum_bayar'
    );
  }

  get paymentHistory(): RegisteredEvent[] {
    return this.registeredEvents.filter(event =>
      event.payment_status === 'completed' ||
      event.payment_status === 'pending' ||
      event.payment_status === 'failed'
    );
  }

  openPaymentModal(event: RegisteredEvent) {
    this.selectedEvent = event;
    this.paymentData = {
      event_id: event.id,
      amount: event.price,
      payment_method: 'transfer'
    };
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedEvent = null;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  viewPaymentProof(event: RegisteredEvent) {
    if (event.payment_proof_path) {
      this.selectedProofUrl = `${environment.baseUrl}/storage/${event.payment_proof_path}`;
      this.showProofModal = true;
    } else {
      this.showToast('Bukti pembayaran tidak tersedia', 'warning');
    }
  }

  closeProofModal() {
    this.showProofModal = false;
    this.selectedProofUrl = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async submitPayment() {
    if (!this.selectedFile) {
      this.showToast('Mohon pilih bukti pembayaran', 'warning');
      return;
    }

    if (!this.selectedEvent) {
      this.showToast('Event tidak ditemukan', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Mengunggah bukti pembayaran...'
    });
    await loading.present();

    try {
      const formData = new FormData();
      formData.append('event_id', this.selectedEvent.id.toString());
      formData.append('amount', this.selectedEvent.price.toString());
      formData.append('payment_method', this.paymentData.payment_method);
      formData.append('payment_proof_path', this.selectedFile);

      const response = await this.paymentService.submitPayment(this.selectedEvent.id, formData);

      // Cek response sukses
      if (response && response.id) {
        // Optimistic update: update status event di registeredEvents
        const idx = this.registeredEvents.findIndex(e => e.id === this.selectedEvent?.id);
        if (idx !== -1) {
          this.registeredEvents[idx] = {
            ...this.registeredEvents[idx],
            payment_status: 'pending',
            payment_proof_path: this.selectedFile.name
          };
        }
        this.showToast('Bukti pembayaran berhasil diunggah', 'success');
        this.closePaymentModal();
        // Polling status pembayaran agar UI langsung update
        this.isPollingPaymentStatus = true;
        this.pollingEventId = this.selectedEvent.id;
        await this.pollForPaymentStatus(this.selectedEvent.id);
        this.isPollingPaymentStatus = false;
        this.pollingEventId = null;
        if (this.returnUrl) {
          this.router.navigate([this.returnUrl]);
        }
      } else {
        // Jika response tidak sesuai ekspektasi
        this.showToast('Gagal mengunggah bukti pembayaran (response tidak valid)', 'danger');
      }
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      if (error.error && error.error.errors) {
        const errorMessages = Object.values(error.error.errors).flat();
        this.showToast(errorMessages.join(', '), 'danger');
      } else if (error.error && error.error.message) {
        this.showToast(error.error.message, 'danger');
      } else if (error.message) {
        this.showToast('Gagal mengunggah bukti pembayaran: ' + error.message, 'danger');
      } else {
        this.showToast('Gagal mengunggah bukti pembayaran (unknown error)', 'danger');
      }
    } finally {
      await loading.dismiss();
    }
  }

  segmentChanged(event: any) {
    this.activeSegment = event.detail.value;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'belum_bayar':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Lunas';
      case 'pending':
        return 'Menunggu Verifikasi Admin';
      case 'failed':
        return 'Pembayaran Ditolak';
      case 'belum_bayar':
        return 'Belum Bayar';
      default:
        return 'Status Tidak Diketahui';
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

  async pollForNewEvent(eventId: number) {
    let attempts = 0;
    const maxAttempts = 15; // polling 15x (30 detik)
    const interval = 2000;
    this.pollingCountdown = interval / 1000;
    while (attempts < maxAttempts) {
      await this.loadData();
      if (this.registeredEvents.some(e => e.id === eventId && e.payment_status === 'belum_bayar')) {
        break;
      }
      // Countdown polling
      this.pollingCountdown = interval / 1000;
      for (let i = this.pollingCountdown; i > 0; i--) {
        this.pollingCountdown = i;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      attempts++;
    }
    if (!this.registeredEvents.some(e => e.id === eventId && e.payment_status === 'belum_bayar')) {
      this.showToast('Event baru akan muncul di pembayaran dalam beberapa detik. Silakan cek status atau refresh jika belum muncul.', 'warning');
    }
    this.pollingCountdown = 0;
  }

  async pollForPaymentStatus(eventId: number) {
    let attempts = 0;
    const maxAttempts = 5;
    const interval = 2000;
    while (attempts < maxAttempts) {
      await this.loadData();
      const event = this.registeredEvents.find(e => e.id === eventId);
      if (event && event.payment_status !== 'belum_bayar') {
        this.showToast('Pembayaran berhasil dikirim, status akan diperbarui setelah diverifikasi admin.', 'success');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    const event = this.registeredEvents.find(e => e.id === eventId);
    if (!event || event.payment_status === 'belum_bayar') {
      // Tambahan: polling selesai tapi status belum berubah
      this.showToast('Status pembayaran akan diperbarui dalam beberapa detik. Silakan cek status manual jika belum berubah.', 'warning');
    }
  }

  async manualCheckPaymentStatus(eventId: number) {
    this.isPollingPaymentStatus = true;
    this.pollingEventId = eventId;
    await this.loadData();
    this.isPollingPaymentStatus = false;
    this.pollingEventId = null;
    const event = this.registeredEvents.find(e => e.id === eventId);
    if (event && event.payment_status !== 'belum_bayar') {
      this.showToast('Status pembayaran sudah diperbarui.', 'success');
    } else {
      this.showToast('Status pembayaran masih belum berubah. Silakan cek lagi beberapa saat.', 'warning');
    }
  }
}
