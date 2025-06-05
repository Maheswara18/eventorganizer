import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegisteredEventsPage } from './registered-events.page';

@NgModule({
  imports: [
    RegisteredEventsPage,
    RouterModule.forChild([
      {
        path: '',
        component: RegisteredEventsPage
      }
    ])
  ]
})
export class RegisteredEventsPageModule {} 