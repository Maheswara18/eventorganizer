import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormTemplateService } from '../../services/form-template.service';
import { RegistrationFormComponent } from '../../components/registration-form/registration-form.component';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface Event {
  id: number;
  admin_id: number;
  image_path: string;
  title: string;
  description: string;
  provides_certificate: number;
  price: string;
  location: string;
  status: string;
  max_participants: number;
  start_datetime: string;
  end_datetime: string;
  created_at: string;
  updated_at: string;
  admin: {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
}

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.page.html',
  styleUrls: ['./event-detail.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class EventDetailPage implements OnInit {
  event: any;
  isLoading = true;
  isRegistered = false;
  isAdmin = false;
  environment = environment;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private formTemplateService: FormTemplateService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.checkAdminStatus();
    await this.loadEvent();
  }

  private async checkAdminStatus() {
    this.authService.currentUser.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
  });
}

  async loadEvent() {
    const loading = await this.loadingController.create({
      message: 'Memuat event...'
    });
    await loading.present();

    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        throw new Error('Event ID not found');
      }

      this.event = await this.eventsService.getEvent(Number(id));
      if (this.event) {
        this.isRegistered = await this.eventsService.checkRegistration(this.event.id);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      const toast = await this.toastController.create({
        message: 'Gagal memuat event',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
      this.isLoading = false;
    }
  }

  async showRegistrationForm() {
    if (!this.event) return;

    try {
      const formTemplate = await firstValueFrom(
        this.formTemplateService.getFormTemplate(this.event.id)
      );

      const modal = await this.modalCtrl.create({
        component: RegistrationFormComponent,
        componentProps: {
          eventId: this.event.id,
          formTemplate: formTemplate.template
        }
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (data?.registered) {
        this.isRegistered = true;
        const toast = await this.toastController.create({
          message: 'Berhasil mendaftar event',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error showing registration form:', error);
      const toast = await this.toastController.create({
        message: 'Gagal memuat form pendaftaran',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  goBack() {
    this.router.navigate(['/events']);
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

  formatPrice(price: string): number {
    return parseFloat(price);
  }
} 