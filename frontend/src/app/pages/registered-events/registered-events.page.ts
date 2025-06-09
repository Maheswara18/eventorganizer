import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController, IonItemSliding } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';
import { RegisteredEvent } from '../../interfaces/event.interface';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-registered-events',
  templateUrl: './registered-events.page.html',
  styleUrls: ['./registered-events.page.scss'],
  imports: [CommonModule, IonicModule, RouterModule]
})
export class RegisteredEventsPage implements OnInit {
  registeredEvents: RegisteredEvent[] = [];
  selectedEvent: RegisteredEvent | null = null;
  isLoading = true;
  environment = environment;

  constructor(
    private router: Router,
    private eventsService: EventsService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadRegisteredEvents();
  }

  async loadRegisteredEvents() {
    this.isLoading = true;
    try {
      this.registeredEvents = await this.eventsService.getRegisteredEvents();
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

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 