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
import { CertificateService } from '../../services/certificate.service';
import { ParticipantService } from '../../services/participant.service';
import { Participant } from '../../interfaces/participant.interface';

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

interface ParticipantStatus {
  attendance_status: string;
  attendance_updated_at: string;
  certificate_status: 'ready' | 'not_ready';
  certificate_download_url: string | null;
  certificate_issued_at: string | null;
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
  participant: Participant | null = null;
  isPresent: boolean = false;
  participantStatus: ParticipantStatus | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private formTemplateService: FormTemplateService,
    private authService: AuthService,
    private certificateService: CertificateService,
    private participantService: ParticipantService
  ) {}

  async ngOnInit() {
    await this.checkAdminStatus();
    await this.loadEvent();
    await this.loadParticipant();
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
      if (!this.event.image_url) {
        this.event.image_url = 'assets/default-event.jpg';
      }

      if (this.event) {
        this.isRegistered = await this.eventsService.checkRegistration(this.event.id);
      }
      await this.loadParticipantStatus(Number(id));
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

  handleImageError(event: Event | any) {
    if (event?.target instanceof HTMLImageElement) {
      event.target.src = 'assets/default-event.jpg';
    }
  }

  async showRegistrationForm() {
    if (!this.event) return;

    try {
      const formTemplate = await firstValueFrom(
        this.formTemplateService.getFormTemplate(this.event.id)
      );

      if (!formTemplate || !formTemplate.fields) {
        throw new Error('Form template tidak tersedia');
      }

      const modal = await this.modalCtrl.create({
        component: RegistrationFormComponent,
        componentProps: {
          event: this.event,
          formTemplate: formTemplate
        }
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (data?.responses) {
        await this.eventsService.registerForEvent(this.event.id, { responses: data.responses });
        this.isRegistered = true;
        const toast = await this.toastController.create({
          message: 'Berhasil mendaftar event',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      }
    } catch (error: any) {
      console.error('Error showing registration form:', error);
      const toast = await this.toastController.create({
        message: error.message || 'Gagal memuat form pendaftaran',
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

  async loadParticipant() {
    if (!this.event) return;
    try {
      this.participant = await firstValueFrom(this.participantService.getMyParticipantByEvent(this.event.id));
      this.isPresent = this.participant.attendance_status === 'present';
    } catch (err) {
      this.participant = null;
      this.isPresent = false;
    }
  }

  async loadParticipantStatus(eventId: number) {
    try {
      this.participantStatus = await this.participantService.getParticipantStatus(eventId).toPromise();
    } catch (error) {
      console.error('Error loading participant status:', error);
    }
  }

  getAttendanceStatusText(status: string): string {
    switch (status) {
      case 'present':
        return 'Hadir';
      case 'absent':
        return 'Tidak Hadir';
      default:
        return 'Belum Dikonfirmasi';
    }
  }

  getCertificateStatusText(status: string): string {
    switch (status) {
      case 'ready':
        return 'Sertifikat Siap Diunduh';
      case 'not_ready':
        return 'Sertifikat Belum Tersedia';
      default:
        return 'Status Tidak Diketahui';
    }
  }

  async downloadCertificate() {
    if (!this.participantStatus?.certificate_download_url) return;

    const loading = await this.loadingController.create({
      message: 'Mengunduh sertifikat...'
    });
    await loading.present();

    try {
      const eventId = this.route.snapshot.params['id'];
      const blob = await this.certificateService.downloadCertificate(eventId).toPromise();

      if (!blob) {
        throw new Error('File tidak ditemukan');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sertifikat-${this.event.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.showToast('Sertifikat berhasil diunduh', 'success');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      this.showToast('Gagal mengunduh sertifikat', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async batalkanPendaftaran() {
    if (!this.event) return;
    const alert = await this.alertController.create({
      header: 'Konfirmasi',
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
            const loading = await this.loadingController.create({ message: 'Membatalkan pendaftaran...' });
            await loading.present();
            try {
              await this.eventsService.unregisterFromEvent(this.event.id);
              this.isRegistered = false;
              await this.loadParticipant();
              this.showToast('Pendaftaran berhasil dibatalkan', 'success');
            } catch (err) {
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
}
