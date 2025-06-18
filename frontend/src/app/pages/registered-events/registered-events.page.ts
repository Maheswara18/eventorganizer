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
import { ParticipantService } from '../../services/participant.service';
import { CertificateService } from '../../services/certificate.service';

// Tambahkan di luar class
export interface ParticipantStatus {
  attendance_status: string;
  attendance_updated_at?: string;
  certificate_status: string;
  certificate_download_url?: string;
  certificate_issued_at?: string;
}

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
  selectedParticipant: any = null;
  isLoading = true;
  environment = environment;
  private paymentStatusSubscription: Subscription;
  participantStatuses: { [eventId: number]: ParticipantStatus | null } = {};

  constructor(
    private router: Router,
    private eventsService: EventsService,
    private paymentService: PaymentService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private participantService: ParticipantService,
    private certificateService: CertificateService
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
      // Ambil status peserta untuk setiap event
      await Promise.all(this.registeredEvents.map(async (event) => {
        try {
          const status = await this.participantService.getParticipantStatus(event.id).toPromise();
          this.participantStatuses[event.id] = status;
        } catch (err) {
          this.participantStatuses[event.id] = null;
        }
      }));
    } catch (error) {
      console.error('Error loading registered events:', error);
      this.showToast('Gagal memuat event terdaftar', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async showEventDetail(event: RegisteredEvent) {
    this.selectedEvent = event;
    try {
      this.selectedParticipant = await this.participantService.getMyParticipantByEvent(event.id).toPromise();
    } catch (err) {
      this.selectedParticipant = null;
    }
  }

  async downloadCertificate() {
    if (!this.selectedParticipant) return;
    const loading = await this.loadingController.create({ message: 'Mengunduh sertifikat...' });
    await loading.present();
    try {
      const blob = await this.certificateService.downloadCertificate(this.selectedParticipant.id).toPromise();
      if (!blob) {
        this.showToast('File sertifikat tidak ditemukan', 'danger');
        await loading.dismiss();
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sertifikat-event-${this.selectedEvent?.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.showToast('Sertifikat berhasil diunduh', 'success');
    } catch (err) {
      this.showToast('Gagal mengunduh sertifikat', 'danger');
    } finally {
      await loading.dismiss();
    }
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
              if (this.selectedEvent && this.selectedEvent.id === eventId) {
                this.selectedEvent = null;
                this.selectedParticipant = null;
              }
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
      const eventId = this.selectedEvent.id;
      this.selectedEvent = null;
      setTimeout(() => {
        this.router.navigate(['/payments'], {
          queryParams: { eventId }
        });
      }, 300);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.environment.baseUrl + '/storage/images/default-event.jpg';
  }

  getPaymentStatusColor(status: FrontendPaymentStatus): string {
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

  getPaymentStatusText(status: FrontendPaymentStatus): string {
    switch (status) {
      case 'completed':
        return 'Lunas';
      case 'pending':
        return 'Menunggu';
      case 'failed':
        return 'Gagal';
      case 'belum_bayar':
        return 'Belum Bayar';
      default:
        return '-';
    }
  }

  getAttendanceStatusText(status: string): string {
    if (status === 'present') return 'Hadir';
    if (status === 'absent') return 'Tidak Hadir';
    if (status === 'pending') return 'Belum Hadir';
    return '-';
  }

  getCertificateStatusText(status: string): string {
    if (status === 'ready') return 'Sertifikat Siap';
    if (status === 'not_ready') return 'Belum Siap';
    return '-';
  }
}