import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, LoadingController, ModalController } from '@ionic/angular';
import { EventsService } from '../../services/events.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FormTemplateService } from '../../services/form-template.service';
import { FormTemplate, FormTemplateResponse } from '../../interfaces/form-template';
import { firstValueFrom } from 'rxjs';
import { FormBuilderComponent } from '../../components/form-builder/form-builder.component';
import { Event as EventModel } from '../../interfaces/event.interface';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-edit-event',
  templateUrl: './edit-event.page.html',
  styleUrls: ['./edit-event.page.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class EditEventPage implements OnInit {
  eventForm: FormGroup;
  eventId: number = 0;
  event!: EventModel;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  formTemplate: FormTemplate | null = null;
  environment = environment;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private formTemplateService: FormTemplateService,
    private modalCtrl: ModalController
  ) {
    this.eventForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      max_participants: [0, [Validators.required, Validators.min(1)]],
      start_datetime: ['', Validators.required],
      end_datetime: ['', Validators.required],
      provides_certificate: [false],
      status: ['draft'],
      isFree: [false]
    });

    this.eventForm.get('isFree')?.valueChanges.subscribe((isFree) => {
      if (isFree) {
        this.eventForm.get('price')?.setValue(0);
        this.eventForm.get('price')?.disable();
      } else {
        this.eventForm.get('price')?.enable();
      }
    });
  }

  async ngOnInit() {
    this.eventId = +this.route.snapshot.paramMap.get('id')!;
    await this.loadEvent();
    await this.loadFormTemplate();
  }

  async loadEvent() {
    const loading = await this.loadingController.create({
      message: 'Memuat data event...'
    });
    await loading.present();

    try {
      const event = await this.eventsService.getEvent(this.eventId);
      this.event = event;
      
      this.eventForm.patchValue({
        title: event.title,
        description: event.description,
        location: event.location,
        price: event.price,
        max_participants: event.max_participants,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        provides_certificate: event.provides_certificate,
        status: event.status,
        isFree: event.price == 0
      });

      if (event.image_path) {
        this.imagePreview = event.image_path;
      }
    } catch (error) {
      console.error('Error loading event:', error);
      await this.showToast('Gagal memuat data event', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  onImageSelected(event: any) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (this.eventForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Menyimpan perubahan...'
      });
      await loading.present();

      try {
        const formData = new FormData();
        const eventData = this.eventForm.getRawValue();

        // Append form fields to FormData
        Object.keys(eventData).forEach(key => {
          if (key === 'isFree') {
            return;
          }
          if (key === 'provides_certificate') {
            formData.append(key, eventData[key] ? '1' : '0');
          } else {
            formData.append(key, eventData[key]);
          }
        });

        // Append image if selected
        if (this.selectedImage) {
          formData.append('image', this.selectedImage);
        }

        await this.eventsService.updateEvent(this.eventId, formData);
        await this.showToast('Event berhasil diperbarui', 'success');
        this.router.navigate(['/events']);
      } catch (error) {
        console.error('Error updating event:', error);
        await this.showToast('Gagal memperbarui event', 'danger');
      } finally {
        await loading.dismiss();
      }
    } else {
      await this.showToast('Mohon lengkapi semua field yang diperlukan', 'warning');
    }
  }

  async createFormTemplate() {
    const modal = await this.modalCtrl.create({
      component: FormBuilderComponent,
      componentProps: {
        eventId: this.eventId
      },
      cssClass: 'form-builder-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        await this.onFormTemplateSubmit(result.data);
      }
    });

    await modal.present();
  }

  async editFormTemplate() {
    if (!this.formTemplate) return;

    const modal = await this.modalCtrl.create({
      component: FormBuilderComponent,
      componentProps: {
        eventId: this.eventId,
        existingTemplate: this.formTemplate
      },
      cssClass: 'form-builder-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        await this.onFormTemplateSubmit(result.data);
      }
    });

    await modal.present();
  }

  async loadFormTemplate() {
    try {
      const response = await firstValueFrom(this.formTemplateService.getFormTemplate(this.eventId));
      // The response IS the FormTemplate, no need to check for response.template
      if (response) {
        this.formTemplate = response;
      }
    } catch (error) {
      console.error('Error loading form template:', error);
      // Don't show a toast here as this is not a critical error
    }
  }
  
  async onFormTemplateSubmit(formData: Partial<FormTemplate>) {
    const loading = await this.loadingController.create({
      message: 'Menyimpan form template...',
      spinner: 'circular'
    });
    await loading.present();
  
    try {
      let response: FormTemplate;
      if (this.formTemplate?.id) {
        // Update existing template
        response = await firstValueFrom(
          this.formTemplateService.updateFormTemplate(this.eventId, this.formTemplate.id, formData)
        );
      } else {
        // Create new template
        response = await firstValueFrom(
          this.formTemplateService.createFormTemplate(this.eventId, formData)
        );
      }
  
      this.formTemplate = response;
      await this.showToast(
        `Form template berhasil ${this.formTemplate?.id ? 'diupdate' : 'dibuat'}`,
        'success'
      );
      await this.loadFormTemplate(); // Reload the template to get fresh data
    } catch (error) {
      console.error('Error saving form template:', error);
      await this.showToast('Gagal menyimpan form template', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
} 