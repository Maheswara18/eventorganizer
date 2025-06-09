import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class RegistrationFormComponent implements OnInit {
  @Input() event: any;
  @Input() formTemplate: any;
  formData: any = {};
  checkboxValues: { [key: string]: string[] } = {};

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    console.log('Form template:', this.formTemplate); // Debug log
    
    // Initialize form data with empty values
    if (this.formTemplate?.fields) {
      this.formTemplate.fields.forEach((field: any) => {
        if (field.type === 'checkbox') {
          this.checkboxValues[field.id] = [];
          field.options.forEach((option: string) => {
            this.formData[`field_${field.id}_${option}`] = false;
          });
        } else {
          this.formData[`field_${field.id}`] = '';
        }
      });
    } else {
      console.error('No fields found in form template');
    }
  }

  handleCheckboxChange(fieldId: number, option: string, event: any) {
    if (!this.checkboxValues[fieldId]) {
      this.checkboxValues[fieldId] = [];
    }
    
    if (event.detail.checked) {
      this.checkboxValues[fieldId].push(option);
    } else {
      const index = this.checkboxValues[fieldId].indexOf(option);
      if (index > -1) {
        this.checkboxValues[fieldId].splice(index, 1);
      }
    }
  }

  isFieldValid(field: any): boolean {
    if (!field.is_required) return true;
    
    if (field.type === 'checkbox') {
      return this.checkboxValues[field.id]?.length > 0;
    }
    
    const value = this.formData[`field_${field.id}`];
    return value !== undefined && value !== null && value !== '';
  }

  async submitForm() {
    if (!this.formTemplate?.fields) {
      const toast = await this.toastCtrl.create({
        message: 'Form template tidak valid',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    // Validate all required fields
    const invalidFields = this.formTemplate.fields
      .filter((field: any) => !this.isFieldValid(field))
      .map((field: any) => field.label);

    if (invalidFields.length > 0) {
      const toast = await this.toastCtrl.create({
        message: `Mohon lengkapi field berikut: ${invalidFields.join(', ')}`,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    // Prepare form responses
    const responses = this.formTemplate.fields.map((field: any) => {
      let value;
      if (field.type === 'checkbox') {
        value = this.checkboxValues[field.id].join(', ');
      } else {
        value = this.formData[`field_${field.id}`];
      }
      
      return {
        field_id: field.id,
        value: value
      };
    });

    await this.modalCtrl.dismiss({ responses });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
} 