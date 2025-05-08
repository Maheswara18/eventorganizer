import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    image_path: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  // Fungsi untuk membuat event baru
  async createEvent() {
    const token = localStorage.getItem('token'); // Token dari localStorage
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post<any>('http://localhost:8000/api/events', this.event, { headers }).subscribe({
      next: async (res) => {
        await this.showToast('Event berhasil dibuat');
        this.router.navigate(['/events']); // Navigasi kembali ke halaman events
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
