import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormTemplate, FormField } from '../../interfaces/form-template';

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class FormBuilderComponent implements OnInit {
  @Input() eventId!: number;
  @Input() existingTemplate?: FormTemplate;
  @Output() formSubmit = new EventEmitter<Partial<FormTemplate>>();

  formBuilderForm: FormGroup;
  fieldTypes = ['text', 'number', 'email', 'select', 'radio', 'checkbox'];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {
    this.formBuilderForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      fields: this.fb.array([])
    });
  }

  ngOnInit() {
    if (this.existingTemplate) {
      this.loadExistingTemplate();
    } else {
      this.addField();
    }
  }

  get fields() {
    return this.formBuilderForm.get('fields') as FormArray;
  }

  createField(field?: FormField) {
    return this.fb.group({
      id: [field?.id],
      label: [field?.label || '', Validators.required],
      type: [field?.type || 'text', Validators.required],
      options: [field?.options || []],
      is_required: [field?.is_required || false],
      order: [field?.order || this.fields.length]
    });
  }

  addField() {
    this.fields.push(this.createField());
  }

  removeField(index: number) {
    this.fields.removeAt(index);
  }

  moveField(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index > 0) {
      this.swapFields(index, index - 1);
    } else if (direction === 'down' && index < this.fields.length - 1) {
      this.swapFields(index, index + 1);
    }
    this.updateFieldOrders();
  }

  private swapFields(i: number, j: number) {
    const fields = this.fields.controls;
    const temp = fields[i];
    fields[i] = fields[j];
    fields[j] = temp;
  }

  private updateFieldOrders() {
    this.fields.controls.forEach((field, index) => {
      field.patchValue({ order: index });
    });
  }

  addOption(fieldIndex: number) {
    const field = this.fields.at(fieldIndex);
    const options = field.get('options')?.value || [];
    options.push('');
    field.patchValue({ options });
  }

  removeOption(fieldIndex: number, optionIndex: number) {
    const field = this.fields.at(fieldIndex);
    const options = field.get('options')?.value;
    options.splice(optionIndex, 1);
    field.patchValue({ options });
  }

  updateOption(fieldIndex: number, optionIndex: number, event: any) {
    const value = event?.detail?.value || '';
    const field = this.fields.at(fieldIndex);
    const options = field.get('options')?.value;
    options[optionIndex] = value;
    field.patchValue({ options });
  }

  private loadExistingTemplate() {
    if (!this.existingTemplate) return;
    
    this.formBuilderForm.patchValue({
      name: this.existingTemplate.name,
      description: this.existingTemplate.description
    });

    this.existingTemplate.fields.forEach((field: FormField) => {
      this.fields.push(this.createField(field));
    });
  }

  onSubmit() {
    if (this.formBuilderForm.valid) {
      const formData: Partial<FormTemplate> = {
        name: this.formBuilderForm.value.name,
        description: this.formBuilderForm.value.description,
        fields: this.formBuilderForm.value.fields.map((field: FormField, index: number) => ({
          ...field,
          order: index,
          options: field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' 
            ? field.options?.filter(opt => opt.trim() !== '') || []
            : []
        }))
      };
      
      // If we're in a modal, dismiss it with the form data
      if (this.modalCtrl) {
        this.modalCtrl.dismiss(formData);
      } else {
        // Otherwise emit the event
        this.formSubmit.emit(formData);
      }
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
} 