import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface EventData {
  id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  max_participants: number;
  start_datetime: string;
  end_datetime: string;
  image_path: string;
  status: string;
  provides_certificate: boolean;
  [key: string]: any; // Index signature
}

@Component({
  standalone: true,
  selector: 'app-edit-event',
  templateUrl: './edit-event.page.html',
  styleUrls: ['./edit-event.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class EditEventPage implements OnInit {
  event: EventData = {
    id: 0,
    title: '',
    description: '',
    location: '',
    price: 0,
    max_participants: 0,
    start_datetime: '',
    end_datetime: '',
    image_path: '',
    status: 'active',
    provides_certificate: false
  };

  selectedImage: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private toastController: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadEvent(parseInt(id));
    }
  }

  async loadEvent(id: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Loading event...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      const eventData = await this.eventsService.getEvent(id);
      
      // Format dates properly
      this.event = {
        ...eventData,
        start_datetime: new Date(eventData.start_datetime).toISOString(),
        end_datetime: new Date(eventData.end_datetime).toISOString()
      };
      
      console.log('Loaded event data:', this.event);
    } catch (error) {
      console.error('Error loading event:', error);
      await this.showToast('Gagal memuat data event');
      this.router.navigate(['/events']);
    } finally {
      loading.dismiss();
    }
  }

  onImageSelected(event: any) {
    const files = event?.target?.files;
    if (files?.length > 0) {
      this.selectedImage = files[0];
    }
  }

  async updateEvent() {
    const loading = await this.loadingCtrl.create({
      message: 'Updating event...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      // Buat objek data yang bersih
      const cleanEventData = {
        title: this.event.title,
        description: this.event.description,
        location: this.event.location,
        price: this.event.price,
        max_participants: this.event.max_participants,
        start_datetime: new Date(this.event.start_datetime).toISOString(),
        end_datetime: new Date(this.event.end_datetime).toISOString(),
        provides_certificate: this.event.provides_certificate,
        status: this.event.status
      };

      // Validasi data
      if (!cleanEventData.title || !cleanEventData.description || !cleanEventData.location) {
        throw new Error('Title, description, and location are required');
      }

      const formData = new FormData();
      
      // Tambahkan method field untuk Laravel
      formData.append('_method', 'PUT');

      // Tambahkan data event yang bersih
      Object.entries(cleanEventData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      // Tambahkan gambar jika ada
      if (this.selectedImage) {
        formData.append('image_path', this.selectedImage);
      }

      console.log('Clean event data:', cleanEventData);

      const updatedEvent = await this.eventsService.updateEvent(this.event.id, formData);
      console.log('Response from server:', updatedEvent);

      await this.showToast('Event berhasil diupdate');

      // Navigasi kembali ke halaman events dengan parameter refresh
      this.router.navigate(['/events'], { 
        queryParams: { 
          refresh: new Date().getTime()
        }
      });
      
    } catch (error: any) {
      console.error('Error updating event:', error);
      await this.showToast(error?.message || 'Gagal mengupdate event');
    } finally {
      loading.dismiss();
    }
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