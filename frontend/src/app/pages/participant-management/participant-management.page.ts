import { Component, OnInit } from '@angular/core';
import { 
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonSearchbar,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonBadge,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonFooter,
  IonIcon,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRow,
  IonCol,
  IonLoading,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonModal,
  IonList
} from '@ionic/angular/standalone';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ParticipantService } from '../../services/participant.service';
import { EventsService } from '../../services/events.service';
import { Participant } from '../../interfaces/participant.interface';
import { Event } from '../../interfaces/event.interface';
import { FormResponse } from '../../interfaces/participant.interface';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-participant-management',
  templateUrl: './participant-management.page.html',
  styleUrls: ['./participant-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonSearchbar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonBadge,
    IonIcon,
    IonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRow,
    IonCol,
    IonLoading,
    IonToast,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonFooter
  ]
})
export class ParticipantManagementPage implements OnInit {
  participants: Participant[] = [];
  events: Event[] = [];
  selectedEventId: number | undefined;
  loading = false;
  error: string | null = null;
  currentPage = 1;
  lastPage = 1;
  searchTerm = '';
  selectedParticipantResponses: FormResponse[] | null = null;

  constructor(
    private participantService: ParticipantService,
    private eventsService: EventsService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.loadEvents();
    this.loadParticipants();
  }

  async ionViewWillEnter() {
    await this.loadEvents();
    this.currentPage = 1;
    await this.loadParticipants();
  }

  async loadEvents() {
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Memuat daftar event...'
      });
      await loading.present();

      this.events = await this.eventsService.getEvents();
      await loading.dismiss();
    } catch (error) {
      console.error('Error loading events:', error);
      await this.showErrorToast('Gagal memuat daftar event');
    }
  }

  async loadParticipants(event?: any) {
    if (!this.loading) {
      this.loading = true;
      this.error = null;

      try {
        const response = await this.participantService.getParticipants(
          this.currentPage,
          this.searchTerm,
          this.selectedEventId
        ).pipe(
          finalize(() => {
            this.loading = false;
            if (event) event.target.complete();
          })
        ).toPromise();

        if (response) {
          this.participants = this.currentPage === 1 
            ? response.data || []
            : [...this.participants, ...(response.data || [])];
          this.lastPage = response.last_page || 1;
        }
      } catch (error: any) {
        this.error = error.message || 'Terjadi kesalahan saat memuat data peserta';
        this.participants = [];
      }
    }
  }

  onEventChange() {
    this.currentPage = 1; // Reset to first page when event changes
    this.loadParticipants();
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.currentPage = 1;
    this.loadParticipants();
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'present': return 'success';
      case 'registered': return 'warning';
      case 'absent': return 'danger';
      default: return 'primary';
    }
  }

  async updateAttendanceStatus(participant: Participant, status: 'present' | 'absent' | 'registered') {
    if (participant.payment_status !== 'paid' && participant.payment_status !== 'completed') {
      await this.showErrorToast('Hanya peserta yang sudah membayar yang dapat diubah status kehadirannya');
      return;
    }
    const loading = await this.loadingCtrl.create({
      message: 'Memperbarui status...'
    });
    await loading.present();
    try {
      const response = await this.participantService.updateStatus(participant.id, status).toPromise();
      participant.attendance_status = status;
      await loading.dismiss();
      await this.showToast('Status kehadiran berhasil diubah');
    } catch (error: any) {
      console.error('Error updating status:', error);
      await loading.dismiss();
      await this.showErrorToast(error.message || 'Gagal memperbarui status');
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'Lunas';
      case 'pending':
        return 'Menunggu Verifikasi';
      case 'failed':
        return 'Ditolak';
      case 'belum_bayar':
      case 'unpaid':
      default:
        return 'Belum Lunas';
    }
  }

  getPaymentStatusColor(status: string): string {
    return (status === 'paid' || status === 'completed') ? 'success' : (status === 'failed' ? 'danger' : 'warning');
  }

  async deleteParticipant(participant: Participant) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus peserta "${participant.user?.name}"?`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
        },
        {
          text: 'Hapus',
          role: 'confirm',
          cssClass: 'alert-button-danger',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Menghapus peserta...'
            });
            await loading.present();
        
            try {
              await this.participantService.deleteParticipant(participant.id).toPromise();
              this.participants = this.participants.filter(p => p.id !== participant.id);
              await this.showToast('Peserta berhasil dihapus');
            } catch (error: any) {
              await this.showErrorToast(error.message || 'Gagal menghapus peserta');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  loadMore(event: any) {
    if (this.currentPage < this.lastPage) {
      this.currentPage++;
      this.loadParticipants(event);
    } else {
      event.target.disabled = true;
      event.target.complete();
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(message: string | null) {
    if (!message) return;
    
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }

  async exportData() {
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Menyiapkan data ekspor...'
      });
      await loading.present();

      const blob = await this.participantService.exportParticipants(
        this.searchTerm,
        this.selectedEventId
      ).toPromise();

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `peserta_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      await loading.dismiss();
      await this.showToast('Data berhasil diekspor');
    } catch (error: any) {
      console.error('Export error:', error);
      await this.showErrorToast('Gagal mengekspor data');
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  showFormResponses(participant: Participant) {
    console.log('Participant selected:', participant);
    console.log('Form Responses:', participant.form_responses);
    this.selectedParticipantResponses = participant.form_responses || null;
    if (this.selectedParticipantResponses) {
      console.log('Modal should open with responses:', this.selectedParticipantResponses);
    } else {
      console.log('No form responses found for this participant.');
    }
  }

  closeFormResponsesModal() {
    this.selectedParticipantResponses = null;
  }
}