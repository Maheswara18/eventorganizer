import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController, IonItemSliding } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';
import { RegisteredEvent } from '../../interfaces/registered-event';

@Component({
  standalone: true,
  selector: 'app-registered-events',
  templateUrl: './registered-events.page.html',
  styleUrls: ['./registered-events.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class RegisteredEventsPage implements OnInit {
  registeredEvents: RegisteredEvent[] = [];
  selectedEvent: RegisteredEvent | null = null;
  isLoading = false;

  constructor(
    private router: Router,
    private eventsService: EventsService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.loadRegisteredEvents();
  }

  async loadRegisteredEvents(event?: any) {
    let loading;
    if (!event) {
      loading = await this.loadingCtrl.create({
        message: 'Memuat daftar event...'
      });
      await loading.present();
    }

    try {
      this.registeredEvents = await this.eventsService.getRegisteredEvents();
    } catch (error) {
      console.error('Error loading registered events:', error);
      await this.showToast('Gagal memuat daftar event', 'danger');
    } finally {
      if (loading) {
        loading.dismiss();
      }
      if (event) {
        event.target.complete();
      }
    }
  }

  async showCancelConfirmation(eventId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi Pembatalan',
      message: 'Anda yakin ingin membatalkan pendaftaran event ini?',
      buttons: [
        {
          text: 'Tidak',
          role: 'cancel'
        },
        {
          text: 'Ya',
          handler: () => this.cancelRegistration(eventId)
        }
      ]
    });

    await alert.present();
  }

  async cancelRegistration(eventId: number) {
    console.log('Starting registration cancellation for event:', eventId);
    const loading = await this.loadingCtrl.create({
      message: 'Membatalkan pendaftaran...'
    });
    await loading.present();

    try {
      await this.eventsService.cancelRegistration(eventId);
      await this.showToast('Pendaftaran event berhasil dibatalkan', 'success');
      this.registeredEvents = this.registeredEvents.filter(event => event.id !== eventId);
    } catch (error: any) {
      console.error('Error canceling registration:', error);
      const message = error.error?.message || 'Gagal membatalkan pendaftaran';
      await this.showToast(message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  showEventDetail(event: RegisteredEvent) {
    this.selectedEvent = event;
  }

  closeEventDetail() {
    this.selectedEvent = null;
  }

  getPaymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'unpaid':
        return 'danger';
      default:
        return 'medium';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  viewEventDetails(eventId: number) {
    this.closeEventDetail();
    this.router.navigate(['/events', eventId]);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
} 