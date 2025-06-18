import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToastController, LoadingController, AlertController, IonicModule } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Event } from '../../interfaces/event.interface';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  imports: [CommonModule, IonicModule, RouterModule]
})
export class EventsPage implements OnInit {
  events: Event[] = [];
  isAdmin = false;
  isLoading = true;
  originalEvents: Event[] = [];
  searchTerm = '';
  error: string | null = null;
  environment = environment;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private eventsService: EventsService,
    private authService: AuthService
  ) {}

  formatPrice(price: any): number {
    return Number(price) || 0;
  }

  async ngOnInit() {
    await this.checkAdminStatus();
    await this.loadEvents();
    
    // Refresh events when navigating back to this page
    this.route.queryParams.subscribe(params => {
    if (params['refresh']) {
        this.loadEvents();
    }
    });
  }

  ionViewWillEnter() {
    // Reload events when entering the page
    this.loadEvents();
  }

  async checkAdminStatus() {
    try {
      this.isAdmin = await this.authService.isAdmin();
    } catch (error) {
      console.error('Error checking admin status:', error);
      this.error = 'Gagal memeriksa status admin';
    }
  }

  async loadEvents() {
    const loading = await this.loadingController.create({
      message: 'Memuat daftar event...',
      spinner: 'circular'
    });

    try {
      this.isLoading = true;
      this.error = null;
    await loading.present();

      const events = await this.eventsService.getEvents();
      console.log('Events loaded:', events); // Debug log

      if (Array.isArray(events)) {
        this.events = events.map(event => ({
          ...event,
          price: Number(event.price)
        }));
        this.originalEvents = [...this.events];
        
        if (this.events.length === 0) {
          this.error = 'Tidak ada event yang tersedia';
        }
      } else {
        throw new Error('Invalid events data format');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      this.error = 'Gagal memuat daftar event';
      await this.showToast('Gagal memuat daftar event', 'danger');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  goToCreateEvent() {
    this.router.navigate(['/create-event']);
  }

  editEvent(eventId: number) {
    this.router.navigate(['/edit-event', eventId]);
  }

  async deleteEvent(eventId: number) {
    const alert = await this.alertController.create({
      header: 'Konfirmasi',
      message: 'Apakah Anda yakin ingin menghapus event ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          role: 'confirm',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Menghapus event...'
            });
            await loading.present();

            try {
              await this.eventsService.deleteEvent(eventId);
              this.events = this.events.filter(event => event.id !== eventId);
              this.originalEvents = this.originalEvents.filter(event => event.id !== eventId);
              await this.showToast('Event berhasil dihapus', 'success');
            } catch (error) {
              console.error('Error deleting event:', error);
              await this.showToast('Gagal menghapus event', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async registerForEvent(eventId: number) {
    const loading = await this.loadingController.create({
      message: 'Mendaftarkan event...'
    });
    await loading.present();

    try {
      await this.eventsService.registerForEvent(eventId, {});
      await this.showToast('Berhasil mendaftar event', 'success');
      await this.loadEvents(); // Reload events to update status
    } catch (error) {
      console.error('Error registering for event:', error);
      await this.showToast('Gagal mendaftar event', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  searchEvents(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.searchTerm = searchTerm;

    if (!searchTerm) {
      this.events = [...this.originalEvents];
      return;
    }

    this.events = this.originalEvents.filter(event =>
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      event.location.toLowerCase().includes(searchTerm)
    );
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
