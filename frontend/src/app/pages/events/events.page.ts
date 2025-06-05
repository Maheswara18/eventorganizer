import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, AlertController, IonicModule } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Mendefinisikan tipe data Event
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
  standalone: true,
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class EventsPage implements OnInit {
  events: Event[] = [];
  isAdmin = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private eventsService: EventsService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    
    // Subscribe ke perubahan query params
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.loadEvents();
      }
    });
    
    await this.loadEvents();
  }

  ionViewWillEnter() {
    // Reload events setiap kali halaman akan ditampilkan
    this.loadEvents();
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  async loadEvents() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading events...'
    });
    await loading.present();

    try {
      this.events = await this.eventsService.getAllEvents();
      loading.dismiss();
    } catch (error) {
      console.error('Error loading events:', error);
      loading.dismiss();
      const toast = await this.toastController.create({
        message: 'Gagal memuat daftar event',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  goToCreateEvent() {
    this.router.navigate(['/create-event']);
  }

  editEvent(eventId: number) {
    this.router.navigate(['/edit-event', eventId]);
  }

  async deleteEvent(eventId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi',
      message: 'Apakah Anda yakin ingin menghapus event ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Menghapus event...'
            });
            await loading.present();

            try {
              await this.eventsService.deleteEvent(eventId);
              loading.dismiss();
              const toast = await this.toastController.create({
                message: 'Event berhasil dihapus',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
              this.loadEvents(); // Reload daftar event
            } catch (error) {
              console.error('Error deleting event:', error);
              loading.dismiss();
              const toast = await this.toastController.create({
                message: 'Gagal menghapus event',
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

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'primary'
    });
    toast.present();
  }
}
