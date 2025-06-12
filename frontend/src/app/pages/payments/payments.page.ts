import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PaymentService, Payment, RegisteredEvent } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { ToastController, LoadingController, ModalController } from '@ionic/angular';
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

  // Form pembayaran
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
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const registeredEvents = await this.paymentService.getRegisteredEvents();
      this.registeredEvents = registeredEvents;
      console.log('Loaded events:', this.registeredEvents);
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Gagal memuat data', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  get unpaidEvents(): RegisteredEvent[] {
    return this.registeredEvents.filter(event => 
      !event.payment_status ||
      event.payment_status === 'failed'
    );
  }

  get paidEvents(): RegisteredEvent[] {
    return this.registeredEvents.filter(event => 
      event.payment_status === 'completed' || 
      event.payment_status === 'paid'
    );
  }

  openPaymentModal(event: RegisteredEvent) {
    this.selectedEvent = event;
    this.paymentData = {
      event_id: event.id,
      amount: event.price,
      payment_method: 'transfer'
    };
    this.selectedFile = null;
    this.previewUrl = null;
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
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async submitPayment() {
    if (!this.selectedFile || !this.eventId) {
      this.showToast('Mohon pilih bukti pembayaran', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Mengunggah bukti pembayaran...'
    });
    await loading.present();

    try {
      const formData = new FormData();
      formData.append('payment_proof', this.selectedFile);
      
      await this.paymentService.submitPayment(this.eventId, formData);
      
      this.showToast('Bukti pembayaran berhasil diunggah', 'success');
      
      // Navigasi kembali ke halaman sebelumnya jika ada returnUrl
      if (this.returnUrl) {
        this.router.navigate([this.returnUrl]);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      this.showToast('Gagal mengunggah bukti pembayaran', 'danger');
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