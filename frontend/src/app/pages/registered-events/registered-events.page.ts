import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController, IonItemSliding } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';

interface RegisteredEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  start_datetime: string;
  end_datetime: string;
  image_path: string;
  payment_status: string;
  registration_date: string;
}

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
  loading = false;

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
    if (!event) {
      const loading = await this.loadingCtrl.create({
        message: 'Loading events...',
        spinner: 'crescent'
      });
      await loading.present();
    }

    try {
      console.log('Fetching registered events...');
      const events = await this.eventsService.getRegisteredEvents();
      console.log('Received events:', events);
      
      if (!events || events.length === 0) {
        console.log('No registered events found');
      }
      
      this.registeredEvents = events;
    } catch (error) {
      console.error('Error loading registered events:', error);
      await this.showToast('Gagal memuat event. Silakan coba lagi.', 'danger');
    } finally {
      if (event) {
        event.target.complete();
      } else {
        this.loadingCtrl.dismiss();
      }
    }
  }

  async cancelRegistration(eventId: number, slidingItem: IonItemSliding) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi Pembatalan',
      message: 'Apakah Anda yakin ingin membatalkan pendaftaran event ini?',
      buttons: [
        {
          text: 'Tidak',
          role: 'cancel',
          handler: () => {
            slidingItem.close();
          }
        },
        {
          text: 'Ya',
          handler: async () => {
            await this.processCancelRegistration(eventId);
            slidingItem.close();
          }
        }
      ]
    });

    await alert.present();
  }

  async cancelRegistrationFromModal(eventId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi Pembatalan',
      message: 'Apakah Anda yakin ingin membatalkan pendaftaran event ini?',
      buttons: [
        {
          text: 'Tidak',
          role: 'cancel'
        },
        {
          text: 'Ya',
          handler: async () => {
            await this.processCancelRegistration(eventId);
            this.closeEventDetail();
          }
        }
      ]
    });

    await alert.present();
  }

  private async processCancelRegistration(eventId: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Membatalkan pendaftaran...'
    });
    await loading.present();

    try {
      await this.eventsService.cancelEventRegistration(eventId);
      await this.showToast('Pendaftaran event berhasil dibatalkan', 'success');
      await this.loadRegisteredEvents();
    } catch (error) {
      console.error('Error canceling registration:', error);
      await this.showToast('Gagal membatalkan pendaftaran', 'danger');
    } finally {
      loading.dismiss();
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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