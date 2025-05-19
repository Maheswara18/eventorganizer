import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
})
export class CreateEventPage {
  event = {
    title: '',
    description: '',
    location: '',
    price: 0,
    max_participants: 0,
    start_datetime: '',
    end_datetime: '',
  };

  selectedImage: File | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }

  async createEvent() {
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('title', this.event.title);
    formData.append('description', this.event.description);
    formData.append('location', this.event.location);
    formData.append('price', this.event.price.toString());
    formData.append('max_participants', this.event.max_participants.toString());
    formData.append('start_datetime', this.event.start_datetime);
    formData.append('end_datetime', this.event.end_datetime);

    if (this.selectedImage) {
      formData.append('image_path', this.selectedImage); // sesuai field backend
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.post('http://localhost:8000/api/events', formData, { headers }).subscribe({
      next: async () => {
        await this.showToast('Event berhasil dibuat');
        this.router.navigate(['/events']);
      },
      error: async (err) => {
        await this.showToast('Gagal membuat event');
        console.error(err);
      }
    });
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
