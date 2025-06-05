import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

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

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    // Initialize form data with empty values
    if (this.formTemplate && this.formTemplate.fields) {
      this.formTemplate.fields.forEach((field: any) => {
        if (field.type === 'checkbox') {
          this.formData[field.name] = [];
        } else {
          this.formData[field.name] = '';
        }
      });
    }
  }

  handleCheckboxChange(fieldName: string, option: string, event: any) {
    if (!this.formData[fieldName]) {
      this.formData[fieldName] = [];
    }
    
    if (event.detail.checked) {
      this.formData[fieldName].push(option);
    } else {
      const index = this.formData[fieldName].indexOf(option);
      if (index > -1) {
        this.formData[fieldName].splice(index, 1);
      }
    }
  }

  isFieldValid(field: any): boolean {
    if (!field.required) return true;
    
    const value = this.formData[field.name];
    if (field.type === 'checkbox') {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  }

  async submitForm() {
    // Validate all required fields
    const invalidFields = this.formTemplate.fields
      .filter((field: any) => !this.isFieldValid(field))
      .map((field: any) => field.label);

    if (invalidFields.length > 0) {
      // Show error for invalid fields
      const errorMessage = `Mohon lengkapi field berikut: ${invalidFields.join(', ')}`;
      // You might want to show this in a toast or alert
      return;
    }

    await this.modalCtrl.dismiss(this.formData);
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
} 