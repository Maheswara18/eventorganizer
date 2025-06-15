export type FrontendPaymentStatus = 'belum_bayar' | 'pending' | 'completed' | 'failed';

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { PaymentService, BackendPaymentStatus } from '../../services/payment.service';
import { CommonModule } from '@angular/common';
import { RegisteredEvent } from '../../interfaces/event.interface';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { QrCodeComponent } from '../../components/qr-code/qr-code.component';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-registered-events',
  templateUrl: './registered-events.page.html',
  styleUrls: ['./registered-events.page.scss'],
  imports: [CommonModule, IonicModule, RouterModule]
})
export class RegisteredEventsPage implements OnInit, OnDestroy {
  registeredEvents: RegisteredEvent[] = [];
  selectedEvent: RegisteredEvent | null = null;
  isLoading = true;
  environment = environment;
  private paymentStatusSubscription: Subscription;

  constructor(
    private router: Router,
    private eventsService: EventsService,
    private paymentService: PaymentService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
    this.paymentStatusSubscription = this.paymentService.paymentStatus$.subscribe(
      status => {
        if (status) {
          this.updateEventPaymentStatus(status.eventId, this.normalizePaymentStatus(status.status));
          this.loadRegisteredEvents();
        }
      }
    );
  }

  ngOnInit() {
    this.loadRegisteredEvents();
  }

  ngOnDestroy() {
    if (this.paymentStatusSubscription) {
      this.paymentStatusSubscription.unsubscribe();
    }
  }

  private normalizePaymentStatus(status: BackendPaymentStatus): FrontendPaymentStatus {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'pending':
      case 'failed':
        return status;
      default:
        return 'failed';
    }
  }

  private updateEventPaymentStatus(eventId: number, status: FrontendPaymentStatus) {
    this.registeredEvents = this.registeredEvents.map(event => {
      if (event.id === eventId) {
        return { ...event, payment_status: status };
      }
      return event;
    });

    if (this.selectedEvent && this.selectedEvent.id === eventId) {
      this.selectedEvent = { ...this.selectedEvent, payment_status: status };
    }

    if (status === 'completed') {
      this.showToast('Pembayaran berhasil diverifikasi', 'success');
    }
  }

  async loadRegisteredEvents() {
    this.isLoading = true;
    try {
      const events = await this.eventsService.getRegisteredEvents();
      this.registeredEvents = events.map(event => ({
        ...event,
        payment_status: event.payment_status || 'belum_bayar'
      }));
    } catch (error) {
      console.error('Error loading registered events:', error);
      this.showToast('Gagal memuat event terdaftar', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  showEventDetail(event: RegisteredEvent) {
    this.selectedEvent = event;
  }

  async unregisterFromEvent(eventId: number) {
    const alert = await this.alertController.create({
      header: 'Konfirmasi Pembatalan',
      message: 'Apakah Anda yakin ingin membatalkan pendaftaran event ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Ya, Batalkan',
          role: 'confirm',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Membatalkan pendaftaran...'
            });
            await loading.present();

            try {
              await this.eventsService.unregisterFromEvent(eventId);
              this.registeredEvents = this.registeredEvents.filter(event => event.id !== eventId);
              this.selectedEvent = null;
              this.showToast('Pendaftaran berhasil dibatalkan', 'success');
            } catch (error) {
              console.error('Error unregistering from event:', error);
              this.showToast('Gagal membatalkan pendaftaran', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showQRCode(event: RegisteredEvent) {
    const modal = await this.modalController.create({
      component: QrCodeComponent,
      componentProps: {
        eventId: event.id,
        eventTitle: event.title
      }
    });

    await modal.present();
  }

  goToPayments() {
    if (this.selectedEvent) {
      this.router.navigate(['/payments'], {
        queryParams: { 
          eventId: this.selectedEvent.id,
          returnUrl: '/registered-events'
        }
      });
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = this.environment.baseUrl + '/storage/images/default-event.jpg';
    }
  }

  getPaymentStatusColor(status: FrontendPaymentStatus): string {
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

  getPaymentStatusText(status: FrontendPaymentStatus): string {
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
}