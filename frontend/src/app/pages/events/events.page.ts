import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

// Mendefinisikan tipe data Event
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
  standalone: false,
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
})
export class EventsPage {
  events: Event[] = []; // Mendeklarasikan events dengan tipe yang benar

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.getEvents();
  }

  goHome() {
  this.router.navigate(['/home']);
}

  async getEvents() {
    // Ambil token dari localStorage atau tempat Anda menyimpannya setelah login
    const token = 'Bearer ' + localStorage.getItem('token');
    
    this.http.get<any>('http://localhost:8000/api/events', {
      headers: {
        Authorization: token
      }
    }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        if (res && res.data) {
          this.events = res.data;
        } else {
          console.error('Format data tidak sesuai');
          this.showToast('Format data tidak sesuai');
        }
      },
      error: async (err) => {
        console.error('Error fetching events:', err);
        await this.showToast('Gagal mengambil data event');
      }
    });
  }  
  
  
  

  goToCreateEvent() {
    this.router.navigate(['/create-event']);
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
