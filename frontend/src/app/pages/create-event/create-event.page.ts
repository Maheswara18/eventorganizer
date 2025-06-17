import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormBuilderComponent } from '../../components/form-builder/form-builder.component';
import { FormTemplateService } from '../../services/form-template.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
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
  imagePreview: string | null = null;
  formTemplate: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController,
    private modalCtrl: ModalController,
    private formTemplateService: FormTemplateService
  ) {}

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async createFormTemplate() {
    const modal = await this.modalCtrl.create({
      component: FormBuilderComponent,
      cssClass: 'form-builder-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.formTemplate = result.data;
      }
    });

    await modal.present();
  }

  async createEvent() {
    if (!this.formTemplate) {
      await this.showToast('Buat form pendaftaran terlebih dahulu');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    try {
      // 1. Buat event terlebih dahulu
      const formData = new FormData();
      formData.append('title', this.event.title);
      formData.append('description', this.event.description);
      formData.append('location', this.event.location);
      formData.append('price', this.event.price.toString());
      formData.append('max_participants', this.event.max_participants.toString());
      formData.append('start_datetime', this.event.start_datetime);
      formData.append('end_datetime', this.event.end_datetime);

      if (this.selectedImage) {
        formData.append('image_path', this.selectedImage);
      }

      const response: any = await firstValueFrom(
        this.http.post('http://localhost:8000/api/events', formData, { headers })
      );

      // 2. Setelah event berhasil dibuat, buat form template
      await firstValueFrom(
        this.formTemplateService.createFormTemplate(response.id, this.formTemplate)
      );

      await this.showToast('Event dan form pendaftaran berhasil dibuat');
      this.router.navigate(['/events']);
    } catch (error) {
      await this.showToast('Gagal membuat event dan form pendaftaran');
      console.error(error);
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
