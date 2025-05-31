import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  max_participants: number;
  start_datetime: string;
  end_datetime: string;
  image_path: string;
}

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.page.html',
  styleUrls: ['./event-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class EventDetailPage implements OnInit {
  event?: Event;
  isLoading = true;
  isRegistered = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadEvent();
  }

  async loadEvent() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading event details...'
    });
    await loading.present();

    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (!id) {
        throw new Error('Invalid event ID');
      }

      this.event = await this.eventsService.getEvent(id);
      this.isRegistered = await this.eventsService.isRegistered(id);
      this.isLoading = false;
      loading.dismiss();
    } catch (error) {
      console.error('Error loading event:', error);
      const toast = await this.toastCtrl.create({
        message: 'Gagal memuat detail event',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      this.router.navigate(['/events']);
      loading.dismiss();
    }
  }

  async registerEvent() {
    if (!this.event?.id) {
      const toast = await this.toastCtrl.create({
        message: 'Data event tidak valid',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const eventId = this.event.id;
    const eventTitle = this.event.title;
    const eventPrice = this.event.price;

    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi Pendaftaran',
      message: `Anda akan mendaftar untuk event "${eventTitle}". Biaya pendaftaran: Rp ${eventPrice.toLocaleString('id-ID')}. Lanjutkan?`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Daftar',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Mendaftarkan event...'
            });
            await loading.present();

            try {
              await this.eventsService.registerEvent(eventId);
              this.isRegistered = true;
              
              loading.dismiss();
              const toast = await this.toastCtrl.create({
                message: 'Berhasil mendaftar event',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
            } catch (error) {
              console.error('Error registering for event:', error);
              loading.dismiss();
              const toast = await this.toastCtrl.create({
                message: 'Gagal mendaftar event',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['/events']);
  }
} 