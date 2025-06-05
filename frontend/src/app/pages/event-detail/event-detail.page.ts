import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormTemplateService } from '../../services/form-template.service';
import { RegistrationFormComponent } from '../../components/registration-form/registration-form.component';
import { firstValueFrom } from 'rxjs';

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
  imports: [IonicModule, CommonModule, RouterModule, FormsModule]
})
export class EventDetailPage implements OnInit {
  event: any;
  isRegistered = false;
  isLoading = true;
  formTemplate: any;
  formData: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private formTemplateService: FormTemplateService
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      await this.loadEvent(id);
    }
  }

  async loadEvent(id: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Memuat detail event...'
    });
    await loading.present();

    try {
      this.event = await this.eventsService.getEvent(id);
      await this.checkRegistrationStatus(id);
      this.isLoading = false;
      loading.dismiss();
    } catch (error) {
      console.error('Error loading event:', error);
      loading.dismiss();
      await this.showToast('Gagal memuat detail event', 'danger');
    }
  }

  async checkRegistrationStatus(id: number) {
    try {
      this.isRegistered = await this.eventsService.checkRegistration(id);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  }

  async registerForEvent(eventId: number) {
    if (!eventId) {
      await this.showToast('ID event tidak valid', 'danger');
      return;
    }

    try {
      // Load form template first
      const formTemplate = await firstValueFrom(this.formTemplateService.getFormTemplate(eventId));
      
      if (!formTemplate) {
        await this.showToast('Form pendaftaran tidak tersedia', 'danger');
        return;
      }

      // Show registration form modal
      const modal = await this.modalCtrl.create({
        component: RegistrationFormComponent,
        componentProps: {
          event: this.event,
          formTemplate: formTemplate
        }
      });

      modal.onDidDismiss().then(async (result) => {
        if (result.data) {
          const loading = await this.loadingCtrl.create({
            message: 'Mendaftarkan event...'
          });
          await loading.present();

          try {
            await this.eventsService.registerForEvent(eventId, result.data);
            this.isRegistered = true;
            loading.dismiss();
            await this.showToast('Berhasil mendaftar event', 'success');
          } catch (error) {
            console.error('Error registering for event:', error);
            loading.dismiss();
            await this.showToast('Gagal mendaftar event', 'danger');
          }
        }
      });

      await modal.present();
    } catch (error) {
      console.error('Error loading form template:', error);
      await this.showToast('Gagal memuat form pendaftaran', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
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