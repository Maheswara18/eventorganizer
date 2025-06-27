export type FrontendPaymentStatus = 'belum_bayar' | 'pending' | 'completed' | 'failed';

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { IonicModule, LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { PaymentService, BackendPaymentStatus } from '../../services/payment.service';
import { CommonModule } from '@angular/common';
import { RegisteredEvent } from '../../interfaces/event.interface';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { QrCodeComponent } from '../../components/qr-code/qr-code.component';
import { ParticipantService } from '../../services/participant.service';
import { CertificateService } from '../../services/certificate.service';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';

export interface ParticipantStatus {
  attendance_status: string;
  attendance_updated_at?: string;
  certificate_status: string;
  certificate_download_url?: string;
  certificate_issued_at?: string;
}

@Component({
  standalone: true,
  selector: 'app-registered-events',
  templateUrl: './registered-events.page.html',
  styleUrls: ['./registered-events.page.scss'],
  imports: [CommonModule, IonicModule, RouterModule]
})
export class RegisteredEventsPage implements OnInit, OnDestroy {
  registeredEvents: RegisteredEvent[] = [];
  selectedEvent: RegisteredEvent | null = null;
  selectedParticipant: any = null;
  isLoading = true;
  environment = environment;
  private paymentStatusSubscription: Subscription;
  participantStatuses: { [eventId: number]: ParticipantStatus | null } = {};

  // Tambahan: untuk deteksi tab aktif
  activePath: string = '';
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private eventsService: EventsService,
    private paymentService: PaymentService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private participantService: ParticipantService,
    private certificateService: CertificateService
  ) {
    // Subscription untuk perubahan status pembayaran
    this.paymentStatusSubscription = this.paymentService.paymentStatus$.subscribe(
      status => {
        if (status) {
          this.updateEventPaymentStatus(status.eventId, this.normalizePaymentStatus(status.status));
          this.loadRegisteredEvents();
        }
      }
    );

    // Subscription untuk deteksi URL aktif
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activePath = event.urlAfterRedirects;
      });
  }

  ngOnInit() {
    this.loadRegisteredEvents();
  }

  ngOnDestroy() {
    if (this.paymentStatusSubscription) {
      this.paymentStatusSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private normalizePaymentStatus(status: BackendPaymentStatus): FrontendPaymentStatus {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'pending':
      case 'failed':
        return status;
      default:
        return 'failed';
    }
  }

  private updateEventPaymentStatus(eventId: number, status: FrontendPaymentStatus) {
    this.registeredEvents = this.registeredEvents.map(event => {
      if (event.id === eventId) {
        return { ...event, payment_status: status };
      }
      return event;
    });

    if (this.selectedEvent && this.selectedEvent.id === eventId) {
      this.selectedEvent = { ...this.selectedEvent, payment_status: status };
    }

    if (status === 'completed') {
      this.showToast('Pembayaran berhasil diverifikasi', 'success');
    }
  }

  async loadRegisteredEvents() {
    this.isLoading = true;
    try {
      const events = await this.eventsService.getRegisteredEvents();
      this.registeredEvents = events.map(event => ({
        ...event,
        payment_status: event.payment_status || 'belum_bayar'
      }));

      await Promise.all(this.registeredEvents.map(async (event) => {
        try {
          const status = await this.participantService.getParticipantStatus(event.id).toPromise();
          this.participantStatuses[event.id] = status;
        } catch (err) {
          this.participantStatuses[event.id] = null;
        }
      }));
    } catch (error) {
      console.error('Error loading registered events:', error);
      this.showToast('Gagal memuat event terdaftar', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async showEventDetail(event: RegisteredEvent) {
    this.selectedEvent = event;
    try {
      this.selectedParticipant = await this.participantService.getMyParticipantByEvent(event.id).toPromise();
    } catch (err) {
      this.selectedParticipant = null;
    }
  }

  async downloadCertificate() {
    // Catatan: Fallback Android 11+ ke Documents, lalu Downloads, lalu Share jika gagal. Log dan toast di setiap step.
    if (!this.selectedParticipant) return;
    const loading = await this.loadingController.create({ message: 'Mengunduh sertifikat...' });
    await loading.present();
    let timeoutHandle: any;
    let timeoutOccured = false;
    try {
      console.log('[Download] Mulai proses download sertifikat');
      const certificates = await this.certificateService.getAllCertificates().toPromise();
      const myCertificate = certificates.find((c: any) => c.event_id === this.selectedEvent?.id && c.participant_id === this.selectedParticipant.id);
      if (!myCertificate) throw new Error('Sertifikat tidak ditemukan');
      const blob = await this.certificateService.downloadCertificate(myCertificate.id).toPromise();
      if (!blob) {
        this.showToast('File sertifikat tidak ditemukan', 'danger');
        await loading.dismiss();
        return;
      }
      console.log('[Download] Blob didapat, size:', blob.size);
      const isCordova = !!(window as any).cordova;
      if (isCordova) {
        const info = await Device.getInfo();
        const isAndroid = info.platform === 'android';
        const androidVersion = parseInt((info.osVersion || '0').split('.')[0]);
        console.log('[Download] isCordova:', isCordova, 'isAndroid:', isAndroid, 'androidVersion:', androidVersion);
        if (isAndroid && androidVersion >= 11) {
          // Android 11+ buka file di browser eksternal, tanpa konversi base64
          const fileUrl = myCertificate?.certificate_download_url;
          console.log('[Download] fileUrl:', fileUrl, 'myCertificate:', myCertificate);
          if (fileUrl) {
            window.open(fileUrl, '_system'); // Cordova: _system, fallback: _blank
            this.showToast('Sertifikat dibuka di browser. Silakan simpan dari sana.', 'success');
          } else {
            this.showToast('Link download sertifikat tidak ditemukan.', 'danger');
          }
          await loading.dismiss();
          return;
        } else if (isAndroid) {
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
          const filename = `sertifikat-event-${this.selectedEvent?.id}.pdf`;
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          await file.writeFile(file.externalRootDirectory + 'Download/', filename, uint8Array, {replace: true});
          alert('Sertifikat berhasil disimpan di: ' + file.externalRootDirectory + 'Download/' + filename);
          this.showToast('Sertifikat berhasil disimpan di Download', 'success');
          console.log('[Download] Sukses simpan di Download Android <11');
        }
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sertifikat-event-${this.selectedEvent?.id}.pdf`;
        a.click();
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
      await loading.dismiss();
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
              // Optimistic update: hapus event dari list dan status
              this.registeredEvents = this.registeredEvents.filter(event => event.id !== eventId);
              delete this.participantStatuses[eventId];
              if (this.selectedEvent && this.selectedEvent.id === eventId) {
                this.selectedEvent = null;
                this.selectedParticipant = null;
              }
              this.showToast('Pendaftaran berhasil dibatalkan', 'success');
              // Force reload data dari backend
              await this.loadRegisteredEvents();
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

  async showQRCode(event: RegisteredEvent) {
    const modal = await this.modalController.create({
      component: QrCodeComponent,
      componentProps: {
        eventId: event.id,
        eventTitle: event.title
      }
    });
    await modal.present();
  }

  goToPayments() {
    if (this.selectedEvent) {
      const eventId = this.selectedEvent.id;
      this.selectedEvent = null;
      setTimeout(() => {
        this.router.navigate(['/payments'], {
          queryParams: { eventId }
        });
      }, 300);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.environment.baseUrl + '/storage/images/default-event.jpg';
  }

  getPaymentStatusColor(status: FrontendPaymentStatus): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getPaymentStatusText(status: FrontendPaymentStatus): string {
    switch (status) {
      case 'completed':
        return 'Lunas';
      case 'pending':
        return 'Menunggu';
      case 'failed':
        return 'Gagal';
      case 'belum_bayar':
        return 'Belum Bayar';
      default:
        return '-';
    }
  }

  getAttendanceStatusText(status: string): string {
    if (status === 'present') return 'Hadir';
    if (status === 'absent') return 'Tidak Hadir';
    if (status === 'pending') return 'Belum Hadir';
    return '-';
  }

  getCertificateStatusText(status: string): string {
    if (status === 'ready') return 'Sertifikat Siap';
    if (status === 'not_ready') return 'Belum Siap';
    return '-';
  }
}
