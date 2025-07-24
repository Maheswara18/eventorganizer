import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule, LoadingController, ToastController, AlertController, ModalController, Platform } from '@ionic/angular';
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
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';

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
  isAdmin = false;
  environment = environment;
  participant: Participant | null = null;
  isPresent: boolean = false;
  participantStatus: ParticipantStatus | null = null;
  isPollingParticipantStatus = false; // <--- Tambahan: status polling
  pollingType: 'register' | 'unregister' | null = null; // <--- Tambahan: tipe polling
  pollingInterval: any = null; // <--- Tambahan: simpan interval polling

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
    private participantService: ParticipantService,
    private platform: Platform
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
      if (this.event) {
        // this.isRegistered = await this.eventsService.checkRegistration(this.event.id);
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
        // Optimistic UI: status langsung berubah
        this.participant = { ...this.participant, payment_status: 'belum_bayar', attendance_status: 'registered' } as any;
        this.isPollingParticipantStatus = true;
        this.pollingType = 'register';
        await this.eventsService.registerForEvent(this.event.id, { responses: data.responses });
        this.showToast('Berhasil mendaftar event', 'success');
        await this.pollParticipantStatus('register');
        this.isPollingParticipantStatus = false;
        this.pollingType = null;
        await this.loadParticipantStatus(this.event.id);
        await this.loadEvent();
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
    if (!this.event || this.isAdmin) return;
    try {
      this.participant = await firstValueFrom(this.participantService.getMyParticipantByEvent(this.event.id));
      this.isPresent = this.participant.attendance_status === 'present';
    } catch (err) {
      // It's okay if participant is not found, it means they are not registered
      this.participant = null;
      this.isPresent = false;
    }
  }

  async loadParticipantStatus(eventId: number) {
    if (this.isAdmin) return;
    try {
      this.participantStatus = await this.participantService.getParticipantStatus(eventId).toPromise();
    } catch (error) {
      // It's okay if not found, means user is not a participant
      console.log('Participant status not found, user is likely not registered for this event.');
      this.participantStatus = null;
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
    // Catatan: Fallback Android 11+ ke Documents, lalu Downloads, lalu Share jika gagal. Log dan toast di setiap step.
    if (!this.participantStatus?.certificate_download_url) return;

    const loading = await this.loadingController.create({
      message: 'Mengunduh sertifikat...'
    });
    await loading.present();
    let timeoutHandle: any;
    let timeoutOccured = false;
    try {
      console.log('[Download] Mulai proses download sertifikat');
      const certificates = await this.certificateService.getAllCertificates().toPromise();
      const myCertificate = certificates.find((c: any) => c.event_id === this.event.id && c.participant_id === this.participant?.id);
      if (!myCertificate) throw new Error('Sertifikat tidak ditemukan');
      const blob = await this.certificateService.downloadCertificate(myCertificate.id).toPromise();
      if (!blob) throw new Error('File tidak ditemukan');
      console.log('[Download] Blob didapat, size:', blob.size);
      const isCordova = !!(window as any).cordova;
      if (isCordova) {
        const info = await Device.getInfo();
        const isAndroid = info.platform === 'android';
        const androidVersion = parseInt((info.osVersion || '0').split('.')[0]);
        console.log('[Download] isCordova:', isCordova, 'isAndroid:', isAndroid, 'androidVersion:', androidVersion);
        if (isAndroid && androidVersion >= 11) {
          // Android 11+ buka file di browser eksternal, tanpa konversi base64
          const fileUrl = (myCertificate?.certificate_download_url || this.participantStatus?.certificate_download_url);
          console.log('[Download] fileUrl:', fileUrl, 'participantStatus:', this.participantStatus, 'myCertificate:', myCertificate);
          if (fileUrl) {
            window.open(fileUrl, '_system'); // Cordova: _system, fallback: _blank
            this.showToast('Sertifikat dibuka di browser. Silakan simpan dari sana.', 'success');
          } else {
            this.showToast('Link download sertifikat tidak ditemukan.', 'danger');
          }
          await loading.dismiss();
          return;
        } else if (isAndroid) {
          // Android < 11 gunakan Cordova File + Android Permissions
          const { File } = await import('@awesome-cordova-plugins/file/ngx');
          const { AndroidPermissions } = await import('@awesome-cordova-plugins/android-permissions/ngx');
          const file = new File();
          const androidPermissions = new AndroidPermissions();
          await androidPermissions.requestPermissions([
            androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE,
            androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE
          ]);
          const hasPerm = await androidPermissions.checkPermission(androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
          if (!hasPerm.hasPermission) {
            alert('Izin penyimpanan tidak diberikan. Tidak bisa menyimpan file.');
            this.showToast('Izin penyimpanan tidak diberikan', 'danger');
            return;
          }
          const filename = `sertifikat-${this.event.title}.pdf`;
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          await file.writeFile(file.externalRootDirectory + 'Download/', filename, uint8Array, {replace: true});
          alert('Sertifikat berhasil disimpan di: ' + file.externalRootDirectory + 'Download/' + filename);
          this.showToast('Sertifikat berhasil disimpan di Download', 'success');
          console.log('[Download] Sukses simpan di Download Android <11');
        }
      } else {
        // Cara download di browser, tanpa plugin native
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sertifikat-${this.event.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.showToast('Sertifikat berhasil diunduh', 'success');
        console.log('[Download] Sukses download di web');
      }
    } catch (error) {
      if (timeoutOccured) {
        this.showToast('Timeout saat mengunduh sertifikat', 'danger');
        console.log('[Download] Timeout error:', error);
      } else {
        this.showToast('Gagal mengunduh sertifikat: ' + String(error), 'danger');
        console.log('Error utama download:', error);
      }
    } finally {
      clearTimeout(timeoutHandle);
      loading.dismiss();
      console.log('[Download] Selesai proses download');
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      let timeout = setTimeout(() => {
        reject(new Error('Timeout konversi blob ke base64'));
      }, 10000);
      reader.onloadend = () => {
        clearTimeout(timeout);
        const base64data = (reader.result as string).split(',')[1];
        console.log('[Download] blobToBase64 selesai');
        resolve(base64data);
      };
      reader.onerror = (err) => {
        clearTimeout(timeout);
        console.log('[Download] blobToBase64 error:', err);
        reject(err);
      };
      console.log('[Download] blobToBase64 mulai');
      reader.readAsDataURL(blob);
    });
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
          handler: async () => {
            try {
              // Optimistic UI: status langsung hilang
              this.participant = null;
              this.isPollingParticipantStatus = true;
              this.pollingType = 'unregister';
              await this.eventsService.unregisterFromEvent(this.event.id);
              this.showToast('Pendaftaran sedang diproses, mohon tunggu...');
              await this.pollParticipantStatus('unregister');
              this.isPollingParticipantStatus = false;
              this.pollingType = null;
              await this.loadParticipantStatus(this.event.id);
              await this.loadEvent();
            } catch (error) {
              this.showToast('Gagal membatalkan pendaftaran', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async pollParticipantStatus(type: 'register' | 'unregister') {
    this.isPollingParticipantStatus = true;
    this.pollingType = type;
    let attempts = 0;
    const maxAttempts = 5;
    const interval = 2000;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(async () => {
      attempts++;
      await this.loadParticipant();
      if ((type === 'register' && this.participant) || (type === 'unregister' && !this.participant)) {
        clearInterval(this.pollingInterval);
        this.isPollingParticipantStatus = false;
        this.pollingType = null;
        if (type === 'unregister') this.showToast('Pendaftaran berhasil dibatalkan', 'success');
        await this.loadParticipantStatus(this.event.id);
        await this.loadEvent();
      } else if (attempts >= maxAttempts) {
        clearInterval(this.pollingInterval);
        this.isPollingParticipantStatus = false;
        this.pollingType = null;
      }
    }, interval);
  }

  async manualCheckParticipantStatus(type: 'register' | 'unregister') {
    this.isPollingParticipantStatus = true;
    this.pollingType = type;
    await this.loadParticipant();
    this.isPollingParticipantStatus = false;
    this.pollingType = null;
    if ((type === 'register' && this.participant) || (type === 'unregister' && !this.participant)) {
      this.showToast('Status pendaftaran sudah diperbarui.', 'success');
      await this.loadParticipantStatus(this.event.id);
      await this.loadEvent();
    } else {
      this.showToast('Status pendaftaran masih belum berubah. Silakan cek lagi beberapa saat.', 'warning');
    }
  }

  get isRegistered(): boolean {
    return !!this.participant;
  }

  get isPaid(): boolean {
    return this.participant?.payment_status === 'completed';
  }

  get isUnpaid(): boolean {
    return this.participant?.payment_status === 'belum_bayar' || this.participant?.payment_status === 'pending';
  }

  goToPaymentPage() {
    if (this.event) {
      this.router.navigate(['/payments'], { queryParams: { eventId: this.event.id } });
    }
  }
} 