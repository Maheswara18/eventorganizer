import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EditEventPageRoutingModule } from './edit-event-routing.module';
import { EditEventPage } from './edit-event.page';
import { FormBuilderModule } from '../../components/form-builder/form-builder.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    EditEventPageRoutingModule,
    FormBuilderModule
  ],
  declarations: [
    EditEventPage
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EditEventPageModule {} 